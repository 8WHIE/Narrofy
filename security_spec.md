# Narrofy Security Specification & Invariants

## 1. Core Data Invariants & Access Control (ABAC)
- **Identity & Profiles**: Users can only create, update, and manage their own document at `users/{uid}` where `request.auth.uid == uid`. Profile editing is permanent and NOT restricted by the 24-hour rule.
- **24-Hour Rule for Stories and Posts**:
  - A user can create a story or post (`authorId == request.auth.uid`).
  - While status is `'draft'`, the creator can edit/delete at any time.
  - Once status is `'published'` (or when a post is published), the author can ONLY edit or delete it within 24 hours of `publishedAt` (i.e. `request.time < resource.data.publishedAt + duration.value(24, 'h')`).
  - After 24 hours, normal creators cannot edit or delete.
  - Calculation MUST use server-side `resource.data.publishedAt` and `request.time`. Never trust user's device clock.
  - Admins/moderators can delete or moderate content even after 24 hours.
- **Comments & Replies**:
  - An authenticated user can create comments where `authorId == request.auth.uid`.
  - Only the comment author (or admin) can update or delete their comment.
- **Likes & Bookmarks**:
  - An authenticated user can only write a like/bookmark document if `userId == request.auth.uid`.
- **Follows**:
  - An authenticated user can only write a follow record where `followerId == request.auth.uid`.
- **Notifications**:
  - Read access is strictly restricted to `resource.data.recipientId == request.auth.uid`.
  - Recipient can update the `read` status.
- **Reading History**:
  - Only the user whose `userId == request.auth.uid` can read and write their own reading history.
- **Categories**:
  - Read-only for all public users; write restricted to admins.
- **Reports**:
  - Authenticated users can create reports (`reporterId == request.auth.uid`). Reads/updates restricted to admins.

## 2. Dirty Dozen Attack Payloads
1. **Ghost Field / Privilege Escalation in Profile**: Malicious user attempts to set `isAdmin: true` or `role: 'admin'` in `users/{uid}`. -> REJECTED.
2. **Impersonated Story Author**: User B attempts to publish a story with `authorId: 'userA'`. -> REJECTED.
3. **Story Edit Past 24 Hours**: Creator attempts to update a published story 25 hours after `publishedAt`. -> REJECTED (`request.time >= publishedAt + 24h`).
4. **Story Delete Past 24 Hours**: Creator attempts to delete a published story 25 hours after `publishedAt`. -> REJECTED.
5. **Story Timestamp Tampering**: Malicious author attempts to set `publishedAt` to future time or bypass server-side timestamp validation. -> REJECTED.
6. **Hijacked Comment Edit**: User B attempts to edit User A's comment. -> REJECTED.
7. **Cross-User Like Creation**: User B creates a like under User A's `userId`. -> REJECTED.
8. **Follow Spoofing**: User B creates a follow record with `followerId: 'userA'` without their auth. -> REJECTED.
9. **Notification Scraping**: User B queries or reads notifications belonging to User A (`recipientId != auth.uid`). -> REJECTED.
10. **Reading History Snooping**: User B reads User A's reading progress. -> REJECTED.
11. **Category Defacement**: Normal authenticated user attempts to create/overwrite categories. -> REJECTED.
12. **Denial of Wallet Payload**: Attacker injects a 50MB title or 10,000 tags into a story document. -> REJECTED by string and array size checks.
