package com.yuy.chatroom;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.yuy.chatroom.mapper")
public class ChatRoomBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChatRoomBackendApplication.class, args);
    }
}