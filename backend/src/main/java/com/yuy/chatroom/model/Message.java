package com.yuy.chatroom.model;

public class Message {
    private MessageType type;
    private String sender;
    private String content;

    public MessageType getType() {
        return this.type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public String getSender() {
        return this.sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getContent() {
        return this.content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Message(MessageType type, String sender, String content) {
        this.type = type;
        this.sender = sender;
        this.content = content;
    }

    public Message() {

    }

    @Override
    public String toString() {
        return "Message{ type = " + type + ", sender = " + sender + ", content = " + content + " }";
    }

}
