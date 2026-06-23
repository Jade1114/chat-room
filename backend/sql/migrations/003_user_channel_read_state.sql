USE chat_room;

CREATE TABLE IF NOT EXISTS user_channel_read_state (
    user_id          VARCHAR(32)     NOT NULL,
    channel_id       VARCHAR(32)     NOT NULL,
    last_read_at     DATETIME(3)     NOT NULL,
    updated_at       DATETIME(3)     NOT NULL,
    PRIMARY KEY (user_id, channel_id),
    INDEX idx_read_state_channel (channel_id),
    CONSTRAINT fk_read_state_user
        FOREIGN KEY (user_id) REFERENCES campus_user(id),
    CONSTRAINT fk_read_state_channel
        FOREIGN KEY (channel_id) REFERENCES campus_channel(id)
) ENGINE=InnoDB;
