# Security Specification - Mundial Draft Fantasy

## 1. Data Invariants
- A `Pick` must belong to a valid `League`.
- A user can only pick a team that is not already picked in that league. (Handled by checking other documents or a global state).
- A user can only pick 1 team from each Pot (A, B, C, D).
- A user can only pick when it is their turn in the draft.
- The `draftOrder` cannot be changed after the draft starts.
- Only the `adminId` of a league can change its status or initiate the draft.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing**: User A trying to create a User profile for User B.
2. **Draft Jumping**: User A trying to pick a team when it is User B's turn.
3. **Double Dipping**: User A trying to pick two teams from Pot A.
4. **Team Stealing**: User A trying to pick a team already picked by User B.
5. **Admin Escalation**: User A trying to change League status without being the admin.
6. **Limit Breaking**: User A trying to pick 5 teams.
7. **Orphaned Pick**: Creating a pick for a league that doesn't exist.
8. **Malicious ID**: Creating a league with a 1MB string as ID.
9. **Timestamp Manipulation**: Setting `updatedAt` to a future date.
10. **Shadow Field**: Adding `isAdmin: true` to a user profile.
11. **Draft Order Hijack**: Changing the `draftOrder` mid-draft.
12. **Unauthorized Read**: Reading a private league's pick details if not a participant (though here they are mostly public within the league).

## 3. Test Runner (Draft)
A `firestore.rules.test.ts` will be implemented to verify these.
