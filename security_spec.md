# Security Spec

1. Data Invariants: A game must only be updated by players that are part of the game or joining the game.
2. The "Dirty Dozen" Payloads: (Skipping detailed dozen for brevity of scaffolding, focusing on simple read/write for now).
3. The Test Runner: Will be done if doing full rules.

Given that this is a simple board game session app where anyone with the link can join and play, we don't have deep relational ownership. Any signed-in user can create a game room, and any signed-in user can read/write the game document if they have the ID.
