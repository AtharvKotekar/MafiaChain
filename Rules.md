🎲 Roles & Setup

Total players: 9

2 × Mafia (villains)

1 × God (moderator/referee)

1 × Doctor

5 × Villagers


Entry fee: 0.01 ETH each → total prize pool = 0.09 ETH.

Chat: One shared group chat (text-only).

No photos, videos, or audio allowed.

No screenshots to share secret roles.


Private role notifications:

As soon as the game starts:

God gets a private DM: “You are the God.”

Mafias each get: “You are Mafia. Your Mafia teammate is X.”

Doctor gets: “You are the Doctor.”

Villagers just know they are Villagers.


Each must acknowledge (react/OK button) so we know they saw it.


Mafia-only VC: Separate 2-person voice channel auto-opened during night phase so they can coordinate kills.



---

🕹️ Gameplay Loop

The game runs for 3 rounds, with each round split into day and night phases.

1.⁠ ⁠Day Phase (~5 minutes)

All 9 players chat in the group.

Bluffing, accusing, pretending roles.

Anyone can claim to be the God or Doctor — but the real God/Doctor identities are never revealed.


2.⁠ ⁠Night Phase

Structured sequence:

Mafia turn (2 minutes)

Mafia VC opens.

They decide who to kill (vote among themselves).


Doctor turn (30 seconds)

Doctor gets a private poll with all player names.

They pick 1 to “save” (can choose self).


Resolution:

If Mafia target = Doctor’s save → system announces: “X was attacked but survived.”

Otherwise: “X has been killed.”



3.⁠ ⁠Special rule — God’s death

If the God dies → the system auto-assigns a new God randomly from alive players.

It is revealed publicly: “The God (X) has been eliminated. A new God has been chosen.”

New God is privately notified of their role.



---

🏆 Win Conditions

If ≥1 Mafia alive after 3 rounds: Mafia win.

If 1 Mafia left: they take full 0.09 ETH.

If 2 Mafias alive: they split 0.045 ETH each.


If no Mafia survive after 3 rounds:

All surviving villagers split the 0.09 ETH equally.




---

⚡ Tech/Build Plan

Smart contract (Ethereum L2 like Base/Sepolia for MVP):

Handles escrow of entry fees.

joinGame() → players pay 0.01 ETH.

Game closes after 9 players join.

ETH stays locked until game ends.

finalizeGame(winners[]) called by backend/God → contract distributes ETH to winners according to rules.


Backend/Game engine (Telegram bot or Farcaster mini-app):

Assigns roles randomly and sends private messages.

Runs the phases:

Opens Mafia VC.

Sends private poll to Doctor.

Posts kill/save announcements.


Tracks game state over 3 rounds.

At end → computes winners → calls finalizeGame().


Front-end / UX:

Shared chat (text only).

Role DMs.

Voting interfaces for Mafia & Doctor.

Public announcements after each night.




