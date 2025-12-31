Role and purpose
This table stores core YouTube video snippet and statistics data for display, search, linking, and compliance tracking.

Table: youtube_video_snippet

Column mappings

video_id
Type: varchar(16)
Source: snippet.id
Purpose: YouTube video ID.
Notes: Unique. Index this.

title
Type: varchar(512)
Source: snippet.title
Purpose: Video title.
Notes: Full-text index if you search titles.

description
Type: text
Source: snippet.description
Purpose: Full description text.
Notes: Full-text index optional.

published_at
Type: timestamptz
Source: snippet.publishedAt
Purpose: Upload time.
Notes: Index for sorting.

channel_id
Type: varchar(64)
Source: snippet.channelId
Purpose: Channel identifier.
Notes: Index for filtering and joins.

channel_title
Type: varchar(256)
Source: snippet.channelTitle
Purpose: Channel display name snapshot.
Notes: Do not use as foreign key.

tags
Type: jsonb
Source: snippet.tags
Purpose: Creator-supplied tags.
Notes: Store as array. Optional GIN index if queried.

category_id
Type: varchar(32)
Source: snippet.categoryId
Purpose: YouTube category reference.
Notes: Index if filtering by category.

view_count
Type: bigint
Source: statistics.viewCount
Purpose: Total views snapshot.
Notes: Store with captured_at.

like_count
Type: bigint
Source: statistics.likeCount
Purpose: Total likes snapshot.
Notes: Store with captured_at.

favorite_count
Type: bigint
Source: statistics.favoriteCount
Purpose: Favorites count snapshot.
Notes: Rarely changes but keep for completeness.

comment_count
Type: bigint
Source: statistics.commentCount
Purpose: Number of comments snapshot.
Notes: Store with captured_at.

duration_seconds
Type: integer
Source: contentDetails.duration
Purpose: Video length in seconds.
Notes: Convert from ISO 8601 duration.

license
Type: varchar(64)
Source: status.license
Purpose: License for compliance.
Notes: Useful for retention rules.

made_for_kids
Type: boolean
Source: status.madeForKids
Purpose: Kids content compliance flag.
Notes: Required for policy enforcement.

caption_available
Type: boolean
Source: contentDetails.caption
Purpose: Indicates captions exist.
Notes: Use as trigger to fetch transcript elsewhere.

captured_at
Type: timestamptz
Source: system-generated
Purpose: When statistics were captured.
Notes: Required for time-series accuracy.

Minimal SQL example

CREATE TABLE youtube_video_snippet (
video_id VARCHAR(16) PRIMARY KEY,
title VARCHAR(512) NOT NULL,
description TEXT NOT NULL,
published_at TIMESTAMPTZ NOT NULL,
channel_id VARCHAR(64) NOT NULL,
channel_title VARCHAR(256) NOT NULL,
tags JSONB,
category_id VARCHAR(32),
view_count BIGINT,
like_count BIGINT,
favorite_count BIGINT,
comment_count BIGINT,
duration_seconds INT NOT NULL CHECK (duration_seconds >= 0),
license VARCHAR(64),
made_for_kids BOOLEAN NOT NULL,
caption_available BOOLEAN NOT NULL,
captured_at TIMESTAMPTZ NOT NULL
);

Indexes to add

UNIQUE or PRIMARY KEY on video_id

INDEX on channel_id

INDEX on published_at

Optional GIN index on tags

Optional full-text index on title and description

This table lines up exactly with the fields you listed and keeps statistics snapshot-safe and compliance-ready.