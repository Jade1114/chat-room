CREATE TABLE campus_user (
    id              VARCHAR(32)     PRIMARY KEY,
    display_name    VARCHAR(64)     NOT NULL,
    role            VARCHAR(16)     NOT NULL,
    school_id       VARCHAR(32)     NULL,
    department_id   VARCHAR(32)     NULL,
    class_id        VARCHAR(32)     NULL
);

CREATE TABLE user_course (
    user_id     VARCHAR(32) NOT NULL,
    course_id   VARCHAR(32) NOT NULL,
    PRIMARY KEY (user_id, course_id)
);

CREATE TABLE campus_channel (
    id              VARCHAR(32)     PRIMARY KEY,
    name            VARCHAR(64)     NOT NULL,
    type            VARCHAR(16)     NOT NULL,
    scope_id        VARCHAR(32)     NOT NULL,
    description     VARCHAR(256)    NULL,
    is_readonly     TINYINT(1)      NOT NULL DEFAULT 0
);
