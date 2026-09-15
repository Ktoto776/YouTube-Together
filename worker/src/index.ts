import { DurableObject } from "cloudflare:workers";

const idSplitter = 100;
function getUserID_KV_Name(id:number){
	return "UserID.part-"+Math.ceil(id/idSplitter)
}
async function getUserIDKeys(name:number|string,env:Env){
	if (typeof name ==="number"){
		name = getUserID_KV_Name(name)
	}; const tab = await env.KV.get(name);
	if (tab){
		try{
			return JSON.parse(tab)
		}catch{
			return []
		}
	}else{
		return []
	}
}
function getSplitIdOffset(id:number){
	return (id-1) %idSplitter
}
async function getUserKeyById(id:number,env:Env){
	return (await getUserIDKeys(id,env))[getSplitIdOffset(id)]
}

async function setUserKeyById(id:number,key:string,env:Env){
	const k = getUserID_KV_Name(id)
	const tab = (await getUserIDKeys(k,env))
	tab[getSplitIdOffset(id)] = key
	await env.KV.put(k, key);
}

async function sha256(key:string) {
	const msgBuffer = new TextEncoder().encode(key);
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}
async function generateNewUserID(IP:string,env:Env) {
	const value = Number(await env.KV.get('lastUserID')) || 0;
	const thisID = value+1;
	await env.KV.put('lastUserID', String(thisID));
	const key = (await sha256(IP+String(Date.now()))).slice(0,16);
	await setUserKeyById(thisID,key,env)
	return {
		id:thisID,
		key:key
	}
}
/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject<Env> {
	userIDs:number[] = [];
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		// Блокируем обработку запросов до завершения инициализации
		ctx.blockConcurrencyWhile(async () => {
			const stored = await ctx.storage.get<number[]>('userIDs');
			this.userIDs = stored ?? [];
		});
	}
	sendOnAllSockets(ignoreWS:WebSocket,message: string){
		const allSockets = this.ctx.getWebSockets();
		for (const ws of allSockets) {
			if (ws!==ignoreWS){
				try{
					ws.send(message);
				}catch{
					// ИГНОРИРУЮ ОШИБКИ
				}
			}
		}
	}
	getOwnerID(){
		return this.userIDs.at(0) ?? -1
	}
	async saveIDs(){
		await this.ctx.storage.put('userIDs', this.userIDs);
	}
	getSocketsById(){
		const socketsById:{
			[id: number]: WebSocket;
		} = {};
		const allSockets = this.ctx.getWebSockets();
		for (const s of allSockets){
			const data = s.deserializeAttachment();
			if (data?.isAuthenticated){
				socketsById[data.id] = s
			}
		}
		return socketsById;
	}
	async refreshIDs(){
		const socketsById = this.getSocketsById()
		this.userIDs = this.userIDs.filter(x => socketsById[x]!=undefined);
		await this.saveIDs();
	}
	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		const data = ws.deserializeAttachment();
		if (data?.isAuthenticated){
			const id = data.id;
			this.userIDs = this.userIDs.filter(x => x !== id);
			await this.saveIDs();
			const newOwner = this.getOwnerID()
			this.sendOnAllSockets(ws,JSON.stringify({
				type:"UserLeft",
				id:id,
				name:data.name,
				newOwner:newOwner,
			}))
		}
	}
	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		const data = ws.deserializeAttachment();
		try{
			if (typeof message==='string'){
				const tMessage = JSON.parse(message)
				if (typeof tMessage !=="object"||tMessage==null){
					return console.log("TMessage is not json table!!")
				}
				if (tMessage.type=="Auth"){
					if (typeof tMessage.name!=='string'){
						return ws.close(1003,"username is not string")
					}
					let id = Number(tMessage.id)
					if (Number.isNaN(id)){
						return ws.close(1003,"userID is not number")
					}
					if (!data.isAuthenticated){
						if (this.userIDs.includes(id)){
							return ws.close(1003,"userID is already exists")
						}else{
							const key = (await getUserKeyById(id,this.env));
							if (typeof key==="string"){
								if (key!==tMessage.key){
									return ws.close(1003,"key error")
								}
							}else{
								const newData = (await generateNewUserID(data.IPHash,this.env))
								id = newData.id,
								ws.send(JSON.stringify({
									type:"UnvaliableKey",
									newData:newData
								}))
							}
						}; this.userIDs.push(id);
						await this.saveIDs();
						const allSockets = this.ctx.getWebSockets();
						for (const sock of allSockets){
							const data = sock.deserializeAttachment();
							if (data.isAuthenticated){
								ws.send(JSON.stringify({
									type:"UserJoined",
									id:data.id,
									name:data.name,
								}))
							}
						}
						ws.send(JSON.stringify({
							type:"AuthEnded",
							ownerId:this.getOwnerID(),
						}))
						this.sendOnAllSockets(ws,JSON.stringify({
							type:"UserJoined",
							id:id,
							name:tMessage.name
						}))
					}else if (data.id!=id){
						return ws.close(1003,"userid is not the same")
					}else{
						this.sendOnAllSockets(ws,JSON.stringify({
							type:"UserdataChanged",
							id:id,
							name:tMessage.name
						}))
					}
					ws.serializeAttachment({
						isAuthenticated:true,
						IPHash:data.IPHash,
						id:id,
						name:tMessage.name
					})
				}else if (data.isAuthenticated){
					tMessage.id = data.id
					tMessage.name = data.name
					this.sendOnAllSockets(ws,JSON.stringify(tMessage))
				}else{
					console.log("No authenticated try to send message")
				}
			}else{
				console.log("Unknown message type")
			}
		}catch (error){
			console.log("JSON syntax error:",error)
		}
	}
	async fetch(request:Request){
		const [client, server] = Object.values(new WebSocketPair());
		this.ctx.acceptWebSocket(server);
		server.serializeAttachment({isAuthenticated:false,
			IPHash: sha256(request.headers.get("CF-Connecting-IP") || "....")
		});
		await this.refreshIDs();
		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}
}

export default {
	/**
	 * @param env - The interface to reference bindings declared in wrangler.jsonc
	 * @param ctx - The execution context of the Worker
	 */
	async fetch(request, env, ctx): Promise<Response> {
		const upgradeHeader = request.headers.get('Upgrade');
		const url = new URL(request.url);
		const path = url.pathname.replace(/^\/+|\/+$/g, '')
		if (!upgradeHeader || upgradeHeader !== 'websocket') {
			if (path=="get-new-userdata"){
				const clientIP = request.headers.get("CF-Connecting-IP") || "....";
				return new Response(JSON.stringify(await generateNewUserID(clientIP,env)), { status: 200 });
				// TODO: Сделай систему аккаунтов
			}
			return new Response('Expected Upgrade: websocket', { status: 426 });
		}
		const pathSplitted = path.split("/");
		if (pathSplitted.length>1){
			return new Response('Wrong path', { status: 400 });
		}
		const room = pathSplitted[0]
		if (room==""){
			return new Response('Room is not defined', { status: 400 });
		}
		const stub = env.DURABLE_OBJECT.getByName(room);
		return stub.fetch(request);
	},
} satisfies ExportedHandler<Env>;