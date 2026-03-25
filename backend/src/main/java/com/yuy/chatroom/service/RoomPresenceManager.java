package com.yuy.chatroom.service;

import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RoomPresenceManager {

    private final RedisTemplate<String, String> template;
    private final Logger log = LoggerFactory.getLogger(RoomPresenceManager.class);

    public RoomPresenceManager(RedisTemplate<String, String> template) {
        this.template = template;
    }

    public boolean addUserToRoom(String username, String roomId) {
        Long long1 = template.opsForSet().add(buildRoomUsersKey(roomId), username);

        if (long1 == null) {
            log.warn("{},{} 相关映射添加失败，已退出", username, roomId);
            return false;
        }

        if (long1 == 0) {
            String string = template.opsForValue().get(buildUserRoomKey(username));
            if (roomId.equals(string)) {
                log.warn("{},{} 相关映射已存在", username, roomId);
                return true;
            } else {
                template.opsForValue().set(buildUserRoomKey(username), roomId);
            }

            string = template.opsForValue().get(buildUserRoomKey(username));
            if (string == null || !string.equals(roomId)) {
                compensateRemoveUserFromRoomSet(username, roomId);
            } else {
                return true;
            }
            return false;
        }

        Boolean result = template.opsForValue().setIfAbsent(buildUserRoomKey(username), roomId);

        if (result != true) {
            compensateRemoveUserFromRoomSet(username, roomId);
            return false;
        } else {
            return true;
        }
    }

    public boolean removeUserFromRoom(String username, String roomId) {
        Long remove = template.opsForSet().remove(buildRoomUsersKey(roomId), username);
        if (remove == 1) {
            String andDelete = template.opsForValue().getAndDelete(buildUserRoomKey(username));
            if (andDelete == null) {
                compensateAddUserFromRoomSet(username, roomId);
                return false;
            } else {
                return true;
            }
        } else {
            log.warn("{}, {} 相关映射删除失败", username, roomId);
            return false;
        }
    }

    public Set<String> getUsersByRoomId(String roomId) {
        return template.opsForSet().members(buildRoomUsersKey(roomId));
    }

    public String getRoomIdByUsername(String username) {
        return template.opsForValue().get(buildUserRoomKey(username));
    }

    private String buildUserRoomKey(String username) {
        return "user:" + username + ":room";
    }

    private String buildRoomUsersKey(String roomId) {
        return "room:" + roomId + ":users";
    }

    private boolean compensateRemoveUserFromRoomSet(String username, String roomId) {
        for (int i = 0; i < 3; i++) {
            Long remove = template.opsForSet().remove(buildRoomUsersKey(roomId), username);
            if (remove == 1) {
                log.info("{},{} 相关映射删除成功", username, roomId);
                return true;
            }
        }
        log.warn("{},{} 相关映射删除失败,请注意检查", username, roomId);
        return false;
    }

    private boolean compensateAddUserFromRoomSet(String username, String roomId) {
        for (int i = 0; i < 3; i++) {
            Long long1 = template.opsForSet().add(buildRoomUsersKey(roomId), username);
            if (long1 == 1) {
                log.info("{}, {} 相关映射补偿添加成功", username, roomId);
                return true;
            }
        }
        log.warn("{}, {} 相关映射补偿添加失败，请注意检查", username, roomId);
        return false;
    }
}
