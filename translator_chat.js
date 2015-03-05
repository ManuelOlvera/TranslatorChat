'use strict';

var TranslatorChat = function(){

    var pushTopicName;
    var sessionID;
    var leftImgIcon;
    var rightImgIcon;
    var loggedInUser;
    var messageInputFieldId;
    var createMessageButtonId;
    var myLanguage;
    var friendLanguage;
    var recordingImgId;
    var finalTranscript = '';
    var recognizing = false;

    // returns the value for the key url paramater passed
    var getUrlParameter = function(sParam){
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0;  i < sURLVariables.length;  i++) {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] === sParam){
                return sParameterName[1];
            }
        }
    };

    var setPushTopicName = function(ptName){
        pushTopicName = ptName;
    };

    var setRecordingImgId = function(imgId){
        recordingImgId = imgId;
    };

    var setMessageInputFieldId = function(fieldId){
        messageInputFieldId = fieldId;
    };

    var setCreateMessageButtonId = function(buttonId){
        createMessageButtonId = buttonId;
    };

    var setLoggedInUser = function(userId){
        loggedInUser = userId;
    };

    var setChatUserIcons = function(leftImg, rightImg){
        leftImgIcon = leftImg;
        rightImgIcon = rightImg;
    };

    var setSessionId = function(sID){
        sessionID = sID;
    };

    // sets the language code and disables the button
    // onchange of any language enabled the button back
    var setLanguages = function(languageButtonId, myLanguagePicklistId, friendLanguagePicklistId ){
        $('#'+languageButtonId).click(function(e) {
            e.preventDefault();
            $(this).attr('disabled', 'disabled');
            myLanguage = $('#'+myLanguagePicklistId).val();
            friendLanguage = $('#'+friendLanguagePicklistId).val();

            // sets the language
            googleRecognition.lang = myLanguage;
        });

        $('#'+myLanguagePicklistId+', #'+friendLanguagePicklistId).change(function(e) {
            e.preventDefault();
            $('#'+languageButtonId).removeAttr('disabled');
        });
    }

    // binds the click event to Create Message button
    var bindCreateMessageClickEvent = function(){
        $('#'+createMessageButtonId).click(function(e) {
            e.preventDefault();
            var message = $('#'+messageInputFieldId).val();
            if(message){
                createMessage(message);
            } else if(!recognizing){
                googleRecognition.start();
            }
        });

        // if the message field contains text and the user presses the enter key
        // a new message would be created
        $('#'+messageInputFieldId).keyup(function(event){
            if(event.keyCode === 13){
                var message = $('#'+messageInputFieldId).val();
                if(message){
                    createMessage(message);
                } else if(!recognizing){
                    googleRecognition.start();
                }
            }
        });
    };

    // scrolls the chat to the bottom
    var scrollsToBottomChat = function(){
        $('.nano').nanoScroller();
        $('.nano').nanoScroller({ scroll: 'bottom' });    
    };

    // renders a new message on the chat using mustache templating engine
    var renderChatMessage = function(position, templateObject){
        var template = (position === 'left') ? $('#leftMessageTemplate').html() : $('#rightMessageTemplate').html();
        Mustache.parse(template);   // optional, speeds up future uses
        var rendered = Mustache.render(template, templateObject);
        $('#chatBody').append(rendered);
        scrollsToBottomChat();
    };

    // creates a message in Salesforce for the current chat where sender is the logged in user
    var createMessage = function(message){
        stopRecording();
        var chatId = getUrlParameter('chatId');
        TranslatorChatController.createMessage(message, chatId, createMessageCallback);
    };

    // result after creating a message in Salesforce
    var createMessageCallback = function(result, event, error){    
        if(result){
            console.log('message created');
        } else {
            alert($Label.Error_Sending_Message);
        }
    };

    // Connect to the CometD endpoint
    var contectPushTopic = function(){
        $.cometd.init({
            url: window.location.protocol+'//'+window.location.hostname+'/cometd/24.0/',
            requestHeaders: { Authorization: 'OAuth ' + sessionID }
        });
    };

    // Subscribe to a topic. JSON-encoded update will be returned in the callback
    var subscribePushTopic = function(){
        if(pushTopicName){
            var topicEndpoint = '/topic/'+pushTopicName
            $.cometd.subscribe(topicEndpoint, function(message) {
                var isLoggedInUserMessage = (loggedInUser === message.data.sobject.Sender__c);
                var userLabelName = isLoggedInUserMessage ? $Label.Chat_You : $Label.Chat_Friend;
                var userIcon = isLoggedInUserMessage ? leftImgIcon :  rightImgIcon;
                var d = new Date(message.data.event.createdDate);
                // using google closure templates
                var templateObject = {
                    body: message.data.sobject.Body__c,
                    createdDate: d.toLocaleString(),
                    img: userIcon,
                    username: userLabelName,
                };

                if(isLoggedInUserMessage){								
                    renderChatMessage('left', templateObject);
                } else {
                    // renderChatMessage('right', templateObject);
                    translate(templateObject); // comment this out to stop consuming translation api calls
                }
            });					
        } else {
            alert($Label.Error_Service_Down);
        }
    };

    var stopRecording = function(){
        if(recognizing){
            googleRecognition.stop();
            recognizing = false;
        }
        $('#'+createMessageButtonId).html($Label.Record_Message_Button);
        $('#'+recordingImgId).hide();
        $('#'+messageInputFieldId).val('');
        finalTranscript = '';
    };

    // sets google recognition listener
    var setGoogleRecognition = function(){
        recognizing = false;
        // Create the recognition object and define the event handlers    
        googleRecognition = new webkitSpeechRecognition(); // global variable
        googleRecognition.continuous = true;         // keep processing input until stopped
        googleRecognition.interimResults = true;     // show interim results
        googleRecognition.lang = myLanguage;

        googleRecognition.onstart = function() {
            recognizing = true;
            $('#'+createMessageButtonId).html($Label.Send_Message_Button);
            $('#'+recordingImgId).show();
        };

        googleRecognition.onerror = function(event) {
            googleRecognition .start();
        };

        googleRecognition.onend = function() {
            stopRecording();
        };

        googleRecognition.onresult = function(event) {
            var interimTranscript = '';
            // Assemble the transcript from the array of results
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if(finalTranscript.length > 0) { // recognizition has finished. ready to create a new message
                if(recognizing){                    			
                    $('#'+createMessageButtonId).trigger( 'click' );
                }
            } else { // recognizition hasn't finished yet, it shows the message that is going to be sent to the user
                $('#'+messageInputFieldId).val(interimTranscript);
            }
        };
    };

    // translate the message
    var translate = function(templateObject) {
        window.translateCallback = function(response) {
            templateObject.body = response + '(' + templateObject.body + ')';
            renderChatMessage('right', templateObject);
            // reads out what comes from Google recogniztion 
            var utterance = new SpeechSynthesisUtterance(response); 
            utterance.lang = myLanguage; 
            window.speechSynthesis.speak(utterance);
        }

        var s = document.createElement('script');
        s.src = 'https://api.microsofttranslator.com/V2/Ajax.svc/Translate' +
                    '?appId=Bearer ' + encodeURIComponent(accessToken) +
                    '&from=' + encodeURIComponent(friendLanguage) +
                    '&to=' + encodeURIComponent(myLanguage) +
                    '&text=' + encodeURIComponent(templateObject.body) +
                    '&oncomplete=translateCallback';
        document.body.appendChild(s);
    };

    return {
        init: function(args){
            setPushTopicName(args.pushTopicName);
            setSessionId(args.sessionID);
            setChatUserIcons(args.leftHandsideChatImg, args.rightHandsideChatImg);
            setLoggedInUser(args.userId);
            setCreateMessageButtonId(args.createMessageButtonId);
            setMessageInputFieldId(args.messageInputFieldId);
            setLanguages(args.languageButtonId, args.myLanguagePicklistId, args.friendLanguagePicklistId);
            setRecordingImgId(args.recordingImgId);
            bindCreateMessageClickEvent();
            contectPushTopic();
            subscribePushTopic();
            setGoogleRecognition();
        }
    };
};
