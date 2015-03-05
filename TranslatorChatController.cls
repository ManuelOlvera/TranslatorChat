public with sharing class TranslatorChatController {

    public String pushTopicName {get; set;}
    private String chatId {get; set;}
    public String accessToken {get; private set;}


    public TranslatorChatController() {}

    /**
    * @author manuel olvera
    * @description checks if the push topic was already created, otherwise creates a new one
    * @date 08/02/15
    */
    public PageReference initPushTopic(){
        try{
            chatId = ApexPages.currentPage().getParameters().get('chatId');
            if(chatId == null){
                return null;
            } else {
                chatId = chatId.substring(0,15);
            }
            pushTopicName = 'Chat'+chatId;

            PushTopic pt = [SELECT Id
                                            FROM PushTopic 
                                            WHERE Name = :pushTopicName
                                            LIMIT 1];

            accessToken = getAccessToken();
        }catch(QueryException e){
            // there's no push topic for this chat
            createPushTopic();
        }catch(Exception e){
            pushTopicName = null;
        }
        return null;
    }

    /**
    * @author manuel olvera
    * @description creates a new message
    * @date 08/02/15 
    */
    @RemoteAction
    public static Boolean createMessage(String body, String chatId){
        try{
            String senderId = UserInfo.getUserId();
            Message__c m = new Message__c(Body__c = body, Chat__c = chatId, Sender__c = senderId);
            insert m;
            return true;
        }catch(Exception e){
            System.debug('error creating new message -> ' +e.getMessage()); 
            return false;
        }
    }

    /**
    * @author manuel olvera
    * @description creates a new push topic in Salesforce.
    *		*Note: As today, push topic dont accept long text areas in the query which
    *			limits the size of body message to 255 characters
    * @date 08/02/15
    */
    private void createPushTopic(){
        try {
            PushTopic pushTopic = new PushTopic();
            pushTopic.Name = 'Chat'+chatId;
            pushTopic.Query = 'SELECT Id, Name, Body__c, Sender__c FROM Message__c WHERE Chat__c = \''+chatId+'\'';
            pushTopic.ApiVersion = 33.0;
            pushTopic.NotifyForOperationCreate = true;
            pushTopic.NotifyForOperationDelete = true;
            pushTopic.NotifyForOperationUndelete = true;
            pushTopic.NotifyForOperationUpdate = true;
            pushTopic.NotifyForFields = 'Where';
            insert pushTopic;
        }catch(DmlException e){
            pushTopicName = null;
        }
    }

    // deletes all push topics as there's a maximum number of topic you can have in your org
    public PageReference deleteAllPushTopics(){
        List<PushTopic> ptList = [SELECT Id FROM PushTopic];
        delete ptList;
        PageReference pr = new PageReference('/apex/TranslatorChat?id='+chatId);
        return pr;
    }


    private String getAccessToken(){
        String clientId = <CLIENT_ID>;
        String secretKey = <SECRET_KEY>;
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://datamarket.accesscontrol.windows.net/v2/OAuth2-13');
        req.setMethod('POST');
        req.setBody('grant_type=client_credentials&client_id='+EncodingUtil.urlEncode(clientId, 'UTF-8')+'&client_secret='+EncodingUtil.urlEncode(secretKey, 'UTF-8')+'&scope=http://api.microsofttranslator.com');
        //req.setCompressed(true); // otherwise we hit a limit of 32000
        req.setHeader('ContentType', 'application/x-www-form-urlencoded');
        try {
            Http http = new Http();
            HttpResponse res = http.send(req);
            return res.getBody();
        } catch(System.CalloutException e) {
            System.debug('Callout error: '+ e);
            return null;
        }
    }
}
