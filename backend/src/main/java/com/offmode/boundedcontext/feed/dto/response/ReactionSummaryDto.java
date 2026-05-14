package com.offmode.boundedcontext.feed.app.dto.response;

public record ReactionSummaryDto(String emoji, long count, boolean myReact) {}
