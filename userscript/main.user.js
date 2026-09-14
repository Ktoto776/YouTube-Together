// ==UserScript==
// @name         YouTube Together
// @namespace    https://docs.scriptcat.org/
// @version      0.1.0
// @description  Just see youtube together💥!
// @author       Timz
// @match        https://*.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.youtube.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @noframes
// ==/UserScript==

(function() {
    'use strict';
    //PRINT
    function print(...data){
        console.log("[YouTube-Together] ",...data)
    }
    // UISettings
    const windowBackgroundColor = '#212121'
    /** @type {HTMLVideoElement} */
    let video = null;
    // UI
    const div = document.createElement('div');
    div.className = "yt-simple-endpoint"
    div.style.cssText = 'height: 55px; display: block; display: flex; align-items: center; margin-left: 15px;';
    const button = document.createElement("button")
    Object.assign(button.style, {
        'border-radius': '8px',
        'display': 'flex', 'flex-direction': 'row', 
        'align-items': 'center',
        border: 'none'
    })
    const buttonName = document.createElement("a")
    buttonName.textContent = "TOGETHER"
    const isWorking = document.createElement("div")
    isWorking.style.cssText = "width: 10px; height: 10px; background: red; border-radius: 50%; margin-right: 5px;"
    isWorking.hidden = true
    button.append(isWorking)
    button.append(buttonName)
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
        maxWidth: '500px',
        padding: '20px',
        boxSizing: 'border-box',
        // скругление
        borderRadius: '12px',
        // цветовая палитра YouTube (тёмная тема)
        background: windowBackgroundColor,
        color: '#ececec',
        // тень для глубины
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    });
    const header = document.createElement('div')
    header.style.cssText = "display: flex; flex-direction: row; align-items: center;"
    const windowHeaderText = document.createElement("h1")
    windowHeaderText.textContent = "YouTube TOGETHER!"
    const closeButton = document.createElement("button")
    closeButton.textContent = '×'
    Object.assign(closeButton.style,{
        'margin-left': '15px',
        height: '33px',
        'aspect-ratio': '1',
        borderRadius: '100%',
        border: 'none',
        color: '#f1f1f1',
        'font-size': '30px',
        background: windowBackgroundColor,
    })
    header.append(windowHeaderText)
    header.append(closeButton)
    frame.append(header)
    theWindow.append(frame)
    // LISTINERS
    closeButton.addEventListener('mousedown', () => {
        closeButton.style.filter = 'brightness(1.3)';
    });
    closeButton.addEventListener('mouseup', () => {
        closeButton.style.filter = '';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.filter = '';
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
    // functions
    /** @type {string} */
    let connectedKey =null;
    function connectVideo(){
        // TODO отправку времени при паузе
        // TODO распаузу но уже без отправки времени
        video.addEventListener('seeked', () => {
            console.log('Перемотка началась, время:', video.currentTime);
        });
    }
    /** @param {string} key */
    function connect(key){
        print("CONNECT",key)
        connectedKey = key
        if (video==null) return false;
        connectVideo()
    }
    function restoreLastSession(){
        let key = GM_getValue("ConnectedKEY",null)
        if (typeof key === 'string'){
            connect(key)
        }
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
        restoreLastSession()
        return true
    }
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