const WebSocket = require('ws');

const roomname = "idk"
const ws = new WebSocket('ws://localhost:8787/'+roomname)
const id = Math.floor(Math.random()*1000)

ws.on('open', () => {
    console.log('Connected');
    ws.send(JSON.stringify({
        type:"Auth",
        id:id,
        name:"tester",
    }));
});
// >UserJoined - пользователь зашел
// >UserdataChanged - пользователь изменил данные
// >UserLeft - Пользователь вышел
// >AuthEnded - Успешный вход
// >UnvaliableKey - +newData с новым ключём(Auth, не нужно заного посылать)

// <Auth - Смена данных/При входе

ws.on('message', (data) => {
    console.log('Received:', data.toString());
});