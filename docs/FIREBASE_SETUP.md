# Firebase Setup

Config đã được điền sẵn trong [assets/js/firebase-config.js](</d:/New folder/HTML/createBio/assets/js/firebase-config.js>) với:

- `projectId`: `createbio-912ba`
- `authDomain`: `createbio-912ba.firebaseapp.com`
- `baseUrl`: `https://inforcard.github.io/create_your_bio`

Bạn không cần tạo thủ công collection `users`, `bios`, `usernames`.
App sẽ tự tạo document khi:

1. User đăng ký tài khoản.
2. User lưu bio lần đầu.

Thứ bạn cần làm trong Firebase Console:

1. Tạo Firestore Database nếu chưa có.
2. Bật `Authentication > Sign-in method > Email/Password`.
3. Dán rules đúng với app này.
4. Deploy lên GitHub Pages.

## Firestore structure

### `users/{uid}`

```json
{
  "uid": "auth uid",
  "email": "user@example.com",
  "displayName": "Nguyen Minh",
  "username": "nguyenminh",
  "usernameLower": "nguyenminh",
  "bioId": "same as uid"
}
```

### `bios/{uid}`

```json
{
  "uid": "auth uid",
  "username": "nguyenminh",
  "usernameLower": "nguyenminh",
  "displayName": "Nguyen Minh",
  "headline": "Designer, filmmaker, builder.",
  "about": "Short personal bio",
  "location": "Ho Chi Minh City, Vietnam",
  "templateId": "atlas",
  "paletteId": "meta-blue",
  "visibility": "public",
  "buttons": [
    { "label": "Portfolio", "url": "https://example.com", "icon": "bx-link-alt" }
  ]
}
```

### `usernames/{username}`

```json
{
  "uid": "auth uid",
  "username": "nguyenminh",
  "visibility": "public"
}
```

## Firestore rules đúng với app này

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create, update: if isOwner(userId);
      allow delete: if false;
    }

    match /bios/{userId} {
      allow read: if resource.data.visibility == "public" || isOwner(userId);
      allow create, update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }

    match /usernames/{username} {
      allow read: if true;
      allow create, update: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Lưu ý quan trọng

- Rules bạn gửi trước đó không dùng được cho app hiện tại vì đang kiểm tra các field như `ownerId`, `bio`, `createdAt` theo cấu trúc khác.
- App hiện tại dùng:
  - `users/{uid}`
  - `bios/{uid}`
  - `usernames/{username}`
- Public link đọc theo `usernames/{username}` rồi map sang `bios/{uid}`.
