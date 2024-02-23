export declare namespace Tiktok {
  interface CollectionResponse<T> {
    statusCode: number,
    itemList: T[]
  }

  interface ChallengeItem {
    "id": string,
    "desc": string,
    "createTime": number,
    "video": {
      "id": string,
      "height": number,
      "width": number,
      "duration": number,
      "ratio": string,
      "cover": string,
      "originCover": string,
      "dynamicCover": string,
      "playAddr": string,
      "downloadAddr": string,
      "shareCover": string [],
      "reflowCover": string
    },
    "author": {
      "id": string,
      "uniqueId": string,
      "nickname": string,
      "avatarThumb": string,
      "avatarMedium": string,
      "avatarLarger": string,
      "signature": string,
      "verified": boolean,
      "secUid": string,
      "secret": boolean,
      "ftc": boolean,
      "relation": number,
      "openFavorite": boolean,
      "commentSetting": number,
      "duetSetting": number,
      "stitchSetting": number,
      "privateAccount": boolean
    },
    "music": {
      "id": string,
      "title": string,
      "playUrl": string,
      "coverThumb": string,
      "coverMedium": string,
      "coverLarge": string,
      "authorName": string,
      "original": boolean,
      "duration": number,
      "album": string
    },
    "challenges": {
      "id": string,
      "title": string,
      "desc": string,
      "profileThumb": string,
      "profileMedium": string,
      "profileLarger": string,
      "coverThumb": string,
      "coverMedium": string,
      "coverLarger": string,
      "isCommerce": boolean
    }[],
    "stats": {
      "diggCount": number,
      "shareCount": number,
      "commentCount": number,
      "playCount": number
    },
    "duetInfo": {
      "duetFromId": string
    },
    "originalItem": boolean,
    "officalItem": boolean,
    "textExtra": {
      "awemeId": string,
      "start": number,
      "end": number,
      "hashtagName": string,
      "hashtagId": string,
      "type": number,
      "userId": string,
      "isCommerce": boolean,
      "userUniqueId": string,
      "secUid": string,
    }[],
    "secret": boolean,
    "forFriend": boolean,
    "digged": boolean,
    "itemCommentStatus": number,
    "showNotPass": boolean,
    "vl1": boolean,
    "itemMute": boolean,
    "authorStats": {
      "followingCount": number,
      "followerCount": number,
      "heartCount": number,
      "videoCount": number,
      "diggCount": number,
      "heart": number
    },
    "privateItem": boolean,
    "duetEnabled": boolean,
    "stitchEnabled": boolean,
    "shareEnabled": boolean,
    "stickersOnItem":
      {
        "stickerType": 4,
        "stickerText": string[]
      }[],
    "isAd": boolean
  }
}
