// ==UserScript==
// @name         YouTube Together
// @namespace    https://docs.scriptcat.org/
// @version      0.1.0
// @description  Just see youtube together💥!
// @author       Timz
// @match        https://*.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.youtube.com
// @connect      *.workers.dev/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @noframes
// ==/UserScript==

(function() {
    'use strict';
    const isTestVersion = true
    const defaultDomen = "s://youtube-together.prudtima07.workers.dev/"
    const UserNoName = "NoName"
    //PRINT
    function print(...data){
        console.log("[YouTube-Together] ",...data)
    }
    // UISettings
    const sizes = {
        GroupSummaryHeight: "16px",
        HeaderFontSize: "28px"
    }
    const isDarkTheme = document.documentElement.hasAttribute('dark');
    const colors = {
        mainButtonColor: (isDarkTheme && '#2f2f2f') || "#f2f2f2",
        mainSelectedButtonColor: (isDarkTheme && '#3f3f3f') || "#f2f2f2",
        mainButtonTextColor: (isDarkTheme && '#f3f3f3') || "#000000",
        windowBackgroundColor: (isDarkTheme && '#212121') || "#ffffff",
        windowCloseSelectedButtonColor: (isDarkTheme && '#4d4d4d') || "#cccccc",
        windowTextColor: (isDarkTheme && '#f1f1f1') || "#0f0f0f0",
        textBoxInWindowColor: (isDarkTheme && "#0f0f0f") || "#eaeaea",
        textColorTBInWindowColor: (isDarkTheme && "#f1f1f1") || "#0f0f0f0",
        textBoundTBInWindowColor: (isDarkTheme && "#3f3f3f") || "#e5e5e5",
        indicator:{
            connected: "green",
            connecting: "yellow",
            error: "red"
        }
    }
    const isRussianLang = document.documentElement.lang.startsWith("ru");
    const texts = {
        ConnectHeader: (isRussianLang && "Подключиться") || "Connect",
        Settings: (isRussianLang && "Настройки") || "Settings",
        NameChanger: (isRussianLang && "Имя: ") || "Name: ",
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
    if (userData==null){
        print("http"+Domain+"get-new-userdata")
        GM_xmlhttpRequest({
            method: "GET",
            url: "http"+Domain+"get-new-userdata",
            onload: function(response) {
                if (response.status==200){
                    try{
                        newUserdata(response.responseText);
                    }catch(error){
                        console.error("[YouTube-Together] Error when parsing new userdata:", error);
                        errorText = "Unknown error when parsing userdata";
                    }
                }else{
                    errorText = "Unknown error: "+response.responseText
                }
                waitForUserData();
            },
            onerror: function(error) {
                console.error("[YouTube-Together] Error when getting new userdata:", error);
                errorText = "Unknown error when getting userdata";
                waitForUserData();
            }
        });
    }
    // UI
    const div = document.createElement('div');
    div.className = "yt-simple-endpoint"
    div.style.cssText = 'height: 55px; display: block; display: flex; align-items: center; margin-left: 15px;';
    const button = document.createElement("button")
    Object.assign(button.style, {
        'border-radius': '8px',
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
    /** @type {ElementCSSInlineStyle.style} */
    const InputStyle = {
        borderRadius: "12px",
        background: colors.textBoxInWindowColor,
        color: colors.textColorTBInWindowColor,
        height: "100%",
    }
    const TextboxHeight = "16px"
    // Settings
    const SettingsDetails = document.createElement("details")
    const SettingsSummary = document.createElement("summary")
    SettingsSummary.style.fontSize = sizes.GroupSummaryHeight
    SettingsSummary.textContent = texts.Settings
    SettingsDetails.append(SettingsSummary)
    const SettingsDiv = document.createElement("div")
    Object.assign(SettingsDiv.style,{
        paddingLeft: sizes.GroupSummaryHeight,
        paddingTop: "5px"
    });
    const NameDiv = document.createElement("div")
    Object.assign(NameDiv.style,{
        display: "flex", 'flex-direction': "row", 'align-items': "center",
        height: TextboxHeight, fontSize: TextboxHeight,
        gap:"5px", marginBottom: "5px"
    });
    NameDiv.textContent = texts.NameChanger
    const NameInput = document.createElement("input")
    NameInput.style.outlineColor = colors.textBoundTBInWindowColor
    NameInput.style.borderColor = colors.textBoundTBInWindowColor
    NameInput.placeholder = UserNoName
    NameInput.value = username
    Object.assign(NameInput.style,InputStyle);
    NameDiv.append(NameInput)
    SettingsDiv.append(NameDiv)
    SettingsDetails.append(SettingsDiv)
    frame.append(SettingsDetails)
    // CONNECT
    const connectDiv = document.createElement("div")
    const connectHeader = document.createElement("span")
    Object.assign(connectHeader.style,{fontWeight:"bold",textAlign:"center",
        fontSize:sizes.HeaderFontSize, width:"100%"
    }); connectHeader.textContent = texts.ConnectHeader;
    connectHeader.textContent = texts.ConnectHeader
    connectDiv.append(connectHeader)
    frame.append(connectDiv)
    theWindow.append(frame)
    // LISTINERS
    button.addEventListener("mouseenter",()=>{
        button.style.background = colors.mainSelectedButtonColor;
    })
    button.addEventListener("mouseleave",()=>{
        button.style.background = colors.mainButtonColor;
    })
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = colors.windowCloseSelectedButtonColor;
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = colors.windowBackgroundColor;
    });
    closeButton.addEventListener('click',()=>{
        theWindow.hidden = true
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
    waitForUserData = ()=>{
        if (errorText===null){
            // Success
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
            name:username
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
    /** @param {string} key */
    function connect(key){
        print("[[CONNECT]]ing TO: ",key)
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
                isWorking.style.background = colors.indicator.connected;
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
            if (event.code==1000){
                isWorking.hidden = true;
            }else{
                isWorking.style.background = colors.indicator.error
                // TODO: Сделай надпись об ошибке
            }
        })
        if (video==null) return false;
        connectVideo()
    }
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
    if (userData!==null){
        waitForUserData()
    }
})();