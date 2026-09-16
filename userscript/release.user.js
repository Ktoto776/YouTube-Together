// ==UserScript==
// @name         YouTube Together
// @namespace    https://docs.scriptcat.org/
// @version      0.1.0
// @description  Just see youtube together💥!
// @author       Timz
// @match        https://*.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.youtube.com
// @connect      workers.dev
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @noframes
// ==/UserScript==

(function() {
    'use strict';
    const thisWSVerion = "1";

    const isTestVersion = false;
    const defaultDomen = "s://youtube-together.prudtima07.workers.dev/";
    const UserNoName = "NoName";
    // PRINT
    function print(...data){
        console.log("[YouTube-Together] ",...data)
    }
    // UISettings
    const sizes = {
        GroupSummaryHeight: "16px",
        HeaderFontSize: "28px",
        TextboxHeight: "16px",
        ButtonFontSize: "24px",
        ErrorDescriptionFontSize: "16px",
        RoomNameFontSize: "13px"
    }
    const isDarkTheme = document.documentElement.hasAttribute('dark');
    const colors = {
        mainButtonColor: (isDarkTheme && '#2f2f2f') || "#f2f2f2",
        mainSelectedButtonColor: (isDarkTheme && '#3f3f3f') || "#e6e6e6",
        mainButtonTextColor: (isDarkTheme && '#f3f3f3') || "#000000",
        windowBackgroundColor: (isDarkTheme && '#212121') || "#ffffff",
        windowCloseSelectedButtonColor: (isDarkTheme && '#4d4d4d') || "#cccccc",
        windowTextColor: (isDarkTheme && '#f1f1f1') || "#0f0f0f",
        windowErrorTextColor: (isDarkTheme && '#f16666') || "#750000",
        textBoxInWindowColor: (isDarkTheme && "#0f0f0f") || "#eaeaea",
        textColorTBInWindowColor: (isDarkTheme && "#f1f1f1") || "#0f0f0f",
        textBoundTBInWindowColor: (isDarkTheme && "#3f3f3f") || "#e5e5e5",
        secondButton:{
            background: (isDarkTheme && '#2f2f2f') || "#f2f2f2",
            content: (isDarkTheme && '#f3f3f3') || "#000000",
        },
        button:{
            selectedBackground: (isDarkTheme && '#dedede') || 'linear-gradient(to bottom, #6a6a6a, #282828)',
            background: (isDarkTheme && '#f3f3f3') || 'linear-gradient(to bottom, #3a3a3a, #000000)',
            content: (isDarkTheme && '#000000') || "#ffffff",
        },
        indicator:{
            connected: "green",
            connecting: "yellow",
            error: "red"
        }
    }
    const isRussianLang = document.documentElement.lang.startsWith("ru");
    const texts = {
        ConnectHeader: (isRussianLang && "Подключиться") || "Connect",
        Settings: (isRussianLang && "Настройки аккаунта") || "Account settings",
        NameChanger: (isRussianLang && "Имя: ") || "Name: ",
        RoomNameInput: (isRussianLang && "Имя комнаты: ") || "Room name: ",
        RoomNamePlaceholder: (isRussianLang && "Где тебя ждут?") || "I'm waiting room name!",
        RandomRoomName: (isRussianLang && "Сгенерировать рандомное") || "Generate random",
        JoinButton: (isRussianLang && "Присоединиться") || "Join",
        ErrorHeader: (isRussianLang && "ОШИБКА") || "ERROR",
        RetryButton: (isRussianLang && "Повторить") || "Retry",
        BackButton: (isRussianLang && "Назад") || "Back",
        Connecting: (isRussianLang && "Подключение") || "Connecting",
        NoRoomError: (isRussianLang && "тебя точно где-то ждут, только пойми где!!\n(и напиши в названии комнаты)") || 
            "Someone is definitely waiting for you somewhere—you just have to figure out where!!\n(And write it in the room name)",
        Connected: (isRussianLang && "Подключено") || "Connected",
        ConnectedToRoom: (isRussianLang && "к комнате ") || "to room ",
    }
    /** @type {HTMLVideoElement} */
    let video = null;
    const Domain = (isTestVersion && "://127.0.0.1:8787/") || defaultDomen
    const userDataSaveName = (isTestVersion && "userData-Test") || "userData"
    /** @type {{id:number,key:string}|null} */
    let userData = JSON.parse(GM_getValue(userDataSaveName,'null'));
    let username = GM_getValue("username",'');
    /** @param {string|object} nuserdata */
    function newUserdata(nuserdata){
        let str
        let newUserdata
        if (typeof nuserdata ==="string"){
            str = nuserdata;
            newUserdata = JSON.parse(nuserdata)
        }else{
            str = JSON.stringify(nuserdata);
            newUserdata = nuserdata
        }
        userData = newUserdata;
        GM_setValue(userDataSaveName,str)
        print("New userdata: ",userData)
    }
    /** @type {string} */
    let errorText = null;
    let waitForUserData = ()=>{};
    function resetUserdata(){
        print("http"+Domain+"get-new-userdata")
        GM_xmlhttpRequest({
            method: "GET",
            url: "http"+Domain+"get-new-userdata",
            onload: function(response) {
                if (response.status==200){
                    try{
                        newUserdata(response.responseText);
                        errorText = null;
                    }catch(error){
                        console.error("[YouTube-Together] Error when parsing new userdata:", error);
                        errorText = "Unknown error when parsing userdata";
                    }
                }else{
                    errorText = "Unknown error: "+response.responseText;
                }
                waitForUserData();
            },
            onerror: function(error) {
                console.error("[YouTube-Together] Error when getting new userdata:", error);
                errorText = "Error: "+error.error+" ("+error.status+")";
                waitForUserData();
            }
        });
    }
    if (userData==null){
        resetUserdata();
    }
    // UI
    const div = document.createElement('div');
    div.className = "yt-simple-endpoint"
    div.style.cssText = 'height: 55px; display: block; display: flex; align-items: center; margin-left: 15px;';
    const button = document.createElement("button")
    Object.assign(button.style, {
        borderRadius: '8px',
        'display': 'flex', 'flex-direction': 'row', 
        'align-items': 'center',
        border: 'none',
        background: colors.mainButtonColor,
        color: colors.mainButtonTextColor,
        fontSize: "15px"
    })
    button.textContent = "TOGETHER"
    const isWorking = document.createElement("div")
    isWorking.style.cssText = "width: 10px; height: 10px; border-radius: 50%; margin-left: 5px;"
    isWorking.hidden = true
    button.append(isWorking)
    div.append(button)
    // Window
    const theWindow = document.createElement("div")
    theWindow.hidden = true
    Object.assign(theWindow.style, {
        position: 'fixed',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '9999',
        background: 'rgba(0,0,0,0.7)',
    });
    const frame = document.createElement('div');
    Object.assign(frame.style, {
        // размеры
        maxWidth: '90%',
        padding: '20px',
        boxSizing: 'border-box',
        // скругление
        borderRadius: '12px',
        background: colors.windowBackgroundColor,
        color: colors.windowTextColor,
        // тень для глубины
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    });
    const header = document.createElement('div')
    Object.assign(header.style,{
        display: "flex", 'flex-direction': "row", 'align-items': "center",
        width: "100%", marginBottom: "5px"
    });
    const windowHeaderText = document.createElement("h1")
    windowHeaderText.style.width = "100%"
    windowHeaderText.textContent = "YouTube TOGETHER!"
    const closeButton = document.createElement("button")
    closeButton.textContent = '×'
    Object.assign(closeButton.style,{
        'margin-left': '15px',
        height: '33px',
        'aspect-ratio': '1',
        borderRadius: '100%',
        border: 'none',
        color: colors.windowTextColor,
        'font-size': '30px',
        background: colors.windowBackgroundColor,
    })
    header.append(windowHeaderText)
    header.append(closeButton)
    frame.append(header)
    const frameDiv = document.createElement("div")
    const funcFrame = document.createElement("overflow")
    Object.assign(funcFrame.style,{
        maxHeight: "90dvh", //90%
        overflowY: "auto",
    })
    /** @type {ElementCSSInlineStyle.style} */
    const InputStyle = {
        borderRadius: "12px",
        background: colors.textBoxInWindowColor,
        color: colors.textColorTBInWindowColor,
        height: "100%",
        outlineColor: colors.textBoundTBInWindowColor,
        borderColor: colors.textBoundTBInWindowColor,
    }
    /** @type {ElementCSSInlineStyle.style} */
    const InputDivStyle = {
        display: "flex", flexDirection: "row", alignItems: "center",
        height: sizes.TextboxHeight, fontSize: sizes.TextboxHeight,
        gap:"5px", marginBottom: "5px"
    }
    // Settings
    const SettingsDetails = document.createElement("details")
    Object.assign(SettingsDetails.style,{
        marginBottom: "10px",
    })
    const SettingsSummary = document.createElement("summary")
    SettingsSummary.style.fontSize = sizes.GroupSummaryHeight
    SettingsSummary.textContent = texts.Settings
    SettingsDetails.append(SettingsSummary)
    const SettingsDiv = document.createElement("div")
    Object.assign(SettingsDiv.style,{
        paddingLeft: sizes.GroupSummaryHeight,
        paddingTop: "10px"
    });
    const NameDiv = document.createElement("div")
    Object.assign(NameDiv.style,InputDivStyle);
    NameDiv.textContent = texts.NameChanger
    const NameInput = document.createElement("input")
    NameInput.placeholder = UserNoName
    NameInput.value = username
    Object.assign(NameInput.style,InputStyle);
    NameDiv.append(NameInput)
    SettingsDiv.append(NameDiv)
    SettingsDetails.append(SettingsDiv)
    funcFrame.append(SettingsDetails)
    const HeaderStyle = {fontWeight:"bold",textAlign:"center",
        fontSize:sizes.HeaderFontSize, width:"100%",
        marginBottom: "5px"
    }
    const ButtonStyle = {
        marginTop: "15px",
        borderRadius: "8px",
        fontSize: sizes.ButtonFontSize,
        background: colors.button.background,
        color: colors.button.content,
        border: "none",
    };
    // CONNECT
    const connectDiv = document.createElement("div")
    Object.assign(connectDiv.style,{
        display: "flex",
        flexDirection: 'column',
        justifyContent: "flex-center"
    })
    const connectHeader = document.createElement("span")
    Object.assign(connectHeader.style,HeaderStyle); 
    connectHeader.textContent = texts.ConnectHeader
    connectDiv.append(connectHeader);
    const CRoomNameDiv = document.createElement("div")
    Object.assign(CRoomNameDiv.style,InputDivStyle);
    CRoomNameDiv.textContent = texts.RoomNameInput
    const CRoomNameInput = document.createElement("input")
    CRoomNameInput.placeholder = texts.RoomNamePlaceholder
    CRoomNameInput.value = ""
    Object.assign(CRoomNameInput.style,InputStyle);
    CRoomNameDiv.append(CRoomNameInput)
    connectDiv.append(CRoomNameDiv)
    const randomRoomName = document.createElement("button")
    Object.assign(randomRoomName.style, {
        marginLeft: "auto",
        borderRadius: "8px",
        background: colors.secondButton.background,
        color: colors.secondButton.content
    });
    randomRoomName.textContent = texts.RandomRoomName
    connectDiv.append(randomRoomName)
    const joinButton = document.createElement("button") // JOIN BUTTON
    Object.assign(joinButton.style,ButtonStyle);
    joinButton.textContent = texts.JoinButton
    connectDiv.append(joinButton)
    funcFrame.append(connectDiv)
    // ERROR
    const errorDiv = document.createElement("div");
    Object.assign(errorDiv.style,{
        display: "flex",
        flexDirection: 'column',
        justifyContent: "flex-center"
    });
    const errorHeader = document.createElement("span")
    Object.assign(errorHeader.style,HeaderStyle); 
    errorHeader.style.color = colors.windowErrorTextColor
    errorHeader.textContent = texts.ErrorHeader
    errorDiv.append(errorHeader);
    const errorDescDiv = document.createElement("div");
    errorDescDiv.style.width = "100%"
    const errorDescription = document.createElement("p")
    errorDescription.style.fontSize = sizes.ErrorDescriptionFontSize
    errorDescription.style.color = colors.windowErrorTextColor
    errorDescDiv.append(errorDescription);
    errorDiv.append(errorDescDiv);
    const errRetryButton = document.createElement("button")
    Object.assign(errRetryButton.style,ButtonStyle);
    errRetryButton.textContent = texts.RetryButton
    errorDiv.append(errRetryButton)
    const errBackButton = document.createElement("button")
    Object.assign(errBackButton.style,ButtonStyle);
    errBackButton.textContent = texts.BackButton
    errorDiv.append(errBackButton)
    funcFrame.append(errorDiv)
    // CONNECTING
    const connectingHeader = document.createElement("span")
    Object.assign(connectingHeader.style,HeaderStyle); 
    connectingHeader.textContent = texts.Connecting
    funcFrame.append(connectingHeader);
    // TODO: CONNECTED
    const connectedDiv = document.createElement("div");
    Object.assign(errorDiv.style,{
        display: "flex",
        flexDirection: 'column',
        justifyContent: "flex-center"
    });
    const connectedHeader = document.createElement("span")
    Object.assign(connectedHeader.style,HeaderStyle); 
    connectedHeader.textContent = texts.Connected;
    connectedDiv.append(connectedHeader);
    const roomNameTitle = document.createElement("p")
    roomNameTitle.style.fontSize = sizes.RoomNameFontSize
    connectedDiv.append(roomNameTitle);
    funcFrame.append(connectedDiv);
    frameDiv.append(funcFrame)
    frame.append(frameDiv)
    theWindow.append(frame)
    // LISTINERS
    button.addEventListener("mouseenter",()=>{
        button.style.background = colors.mainSelectedButtonColor;
    })
    button.addEventListener("mouseleave",()=>{
        button.style.background = colors.mainButtonColor;
    });
    // Buttons
    joinButton.addEventListener('mousedown', () => {
        joinButton.style.opacity = '0.75';
    });
    joinButton.addEventListener('mouseup', () => {
        joinButton.style.opacity = '';
    });
    joinButton.addEventListener("mouseenter",()=>{
        joinButton.style.background = colors.button.selectedBackground;
    });
    joinButton.addEventListener("mouseleave",()=>{
        joinButton.style.background = colors.button.background;
        joinButton.style.opacity = '';
    });
    errRetryButton.addEventListener('mousedown', () => {
        errRetryButton.style.opacity = '0.75';
    });
    errRetryButton.addEventListener('mouseup', () => {
        errRetryButton.style.opacity = '';
    });
    errRetryButton.addEventListener("mouseenter",()=>{
        errRetryButton.style.background = colors.button.selectedBackground;
    });
    errRetryButton.addEventListener("mouseleave",()=>{
        errRetryButton.style.background = colors.button.background;
        errRetryButton.style.opacity = '';
    });
    errBackButton.addEventListener('mousedown', () => {
        errBackButton.style.opacity = '0.75';
    });
    errBackButton.addEventListener('mouseup', () => {
        errBackButton.style.opacity = '';
    });
    errBackButton.addEventListener("mouseenter",()=>{
        errBackButton.style.background = colors.button.selectedBackground;
    });
    errBackButton.addEventListener("mouseleave",()=>{
        errBackButton.style.background = colors.button.background;
        errBackButton.style.opacity = '';
    });
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = colors.windowCloseSelectedButtonColor;
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = colors.windowBackgroundColor;
    });
    closeButton.addEventListener('click',()=>{
        theWindow.hidden = true
    })
    function generateRandomRoomName(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const array = new Uint32Array(length);
        crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            result += chars[array[i] % chars.length];
        }
        return result;
    }
    randomRoomName.addEventListener("click",()=>{
        CRoomNameInput.value = generateRandomRoomName();
    })
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            theWindow.hidden = true
        }
    }); 
    // BUTTON
    button.addEventListener('click', () => {
        theWindow.hidden = false
    });
    function hideAll(){
        connectDiv.hidden = true;
        errorDiv.hidden = true;
        isWorking.hidden = true;
        connectingHeader.hidden = true;
        connectedDiv.hidden = true;
    }; hideAll();
    connectingHeader.hidden = false;
    let userdataWaited = false;
    waitForUserData = ()=>{
        if (errorText===null){
            if (userData!==null){
                userdataWaited = true;
                hideAll();
                connectDiv.hidden = false;
            }
            // Success
        }else{
            hideAll();
            isWorking.hidden = false;
            isWorking.style.background = colors.indicator.error;
            errorDescription.textContent = errorText;
            errorDiv.hidden = false;
            errRetryButton.hidden = false;
            errBackButton.hidden = true;
            errRetryButton.onclick = ()=>{
                errRetryButton.hidden = true;
                resetUserdata();
            }
        }
    }
    // functions
    let isConnected = false;
    let isConnecting = false;
    /** @type {WebSocket | null} */
    let socket = null;
    function getAuthData(){
        return {
            type:"Auth",
            id:userData.id,
            key:userData.key,
            name:username,
            version:thisWSVerion
        }
    }
    NameInput.addEventListener("change",(event)=>{
        username = event.target.value;
        GM_setValue("username",username)
        if (isConnected){
            socket.send(JSON.stringify(getAuthData()));
        }
    })
    // Room vars
    let isImOwner = false;
    let ownerID = 0;
    // ROOM FUNCTIONS
    function newOwnerUserID(newOwnerID){
        isImOwner = newOwnerID===userData.id;
        ownerID = newOwnerID
        // TODO: надпись у овнера
    }
    // SOCKET FUNCTIONS
    /** @type {string} */
    let lastConnectedKey =null;
    function connectVideo(){
        // TODO отправку времени при паузе
        // TODO распаузу но уже без отправки времени
        video.addEventListener('seeked', () => {
            console.log('Перемотка началась, время:', video.currentTime);
        });
    }
    function atConnectMenu(){
        if (socket!==null){
            socket.close(1000)
        }else{
            isConnected = false;
            isConnecting = false;
            hideAll();
            connectDiv.hidden = false;
        }
    }
    /** @param {string} key */
    function connect(key){
        hideAll();
        if (key==""){
            errorDiv.hidden = false;
            errorDescription.textContent = texts.NoRoomError;
            errRetryButton.hidden = true;
            errBackButton.hidden = false;
            errBackButton.onclick = ()=>{
                atConnectMenu();
            }
            return;
        }else{
            print("[[CONNECT]]ing TO: ",key)
            connectingHeader.hidden = false;
        }
        socket = new WebSocket("ws"+Domain+key);
        isConnecting = true;
        isConnected = false;
        isWorking.hidden = false;
        isWorking.style.background = colors.indicator.connecting;
        lastConnectedKey = key;
        socket.addEventListener("open",()=>{
            socket.send(JSON.stringify(getAuthData()))
        })
        socket.addEventListener("message",(event)=>{
            const data = JSON.parse(event.data);
            if (data.type==="AuthEnded"){
                isConnecting = false;
                isConnected = true;
                hideAll();
                isWorking.hidden = false;
                isWorking.style.background = colors.indicator.connected;
                connectedDiv.hidden = false;
                roomNameTitle.textContent = texts.ConnectedToRoom+key;
                newOwnerUserID(data.ownerId)
            }else if(data.type==="UnvaliableKey"){
                newUserdata(data.newData);
            }else if(data.type==="UserLeft"){
                if (data.newOwner!==ownerID){
                    newOwnerUserID(data.newOwner)
                } // TODO: Выход пользователя
            }else if(data.type=="UserJoined"){
                // TODO: Сделать вход пользователя
            }
        })
        socket.addEventListener("close",(event)=>{
            isConnecting = false;
            isConnected = false;
            socket = null;
            if (event.code==1000){
                atConnectMenu();
            }else{
                hideAll();
                isWorking.hidden = false;
                isWorking.style.background = colors.indicator.error;
                errorDiv.hidden = false;
                errorDescription.textContent = event.reason+" ("+event.code+")"
                errBackButton.hidden = false;
                errRetryButton.hidden = false;
                errRetryButton.onclick = ()=>{
                    connect(key);
                }
                errBackButton.onclick = ()=>{
                    atConnectMenu();
                }
            }
        })
        if (video==null) return false;
        connectVideo()
    }
    joinButton.addEventListener("click",()=>{
        connect(CRoomNameInput.value);
    })
    // Insert UI
    function createTeamButton(){
        /** @type {HTMLElement} */
        let logo = null;
        const codes = document.querySelectorAll("#country-code");
        for (const k in codes){
            const parent = codes[k].parentElement
            if (!parent) continue;
            if (parent.id.includes("logo")&&parent.className.includes("ytd-masthead")){
                logo = parent
                break
            }
        }
        if (logo==null) return false;
        print("CREATING",logo)
        logo.append(div)
        document.body.append(theWindow)
        // VIDEO
        video = document.querySelector("video")
        if (userData!==null&&!userdataWaited){
            waitForUserData();
        }
        return true
    }
    // WAIT FOR PAGE LOAD
    if (createTeamButton()) return;
    const observer = new MutationObserver(() => {
        if (createTeamButton()) {
            observer.disconnect();
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: false
    });
})();