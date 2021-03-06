package com.libqa.web.service.feed.actor;

import com.libqa.application.enums.ActionType;
import com.libqa.application.enums.PostType;
import com.libqa.web.domain.User;
import lombok.Getter;

public abstract class FeedActionActor {
    @Getter
    private Integer feedActorId;

    @Getter
    private User actionUser;

    /**
     * @param feedActorId 각 actor의 unique key를 나타낸다.
     *                    feed -> feedThreadId, feedReply -> feedReplyId
     * @param actionUser  action을 취한 user
     */
    FeedActionActor(Integer feedActorId, User actionUser) {
        this.feedActorId = feedActorId;
        this.actionUser = actionUser;
    }

    public abstract PostType getPostType();

    public abstract ActionType getActionType();
}
