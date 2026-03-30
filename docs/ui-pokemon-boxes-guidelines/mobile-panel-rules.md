# Mobile Panel Rules

## Selected-Pokemon panel

- On phone, the selected-Pokemon panel must stay notably shorter than the desktop version.
- The mobile panel should not consume space that is better used by the box grid.
- Restructure first before shrinking everything blindly.

## Required mobile arrangement

- Place sprite, Pokemon name, and types on the left.
- Place secondary stats on the right.
- Keep the red shell visible, but do not let empty red areas dominate the screen.

## Mobile validation

- Recheck the panel after every density pass.
- Verify that the grid still gains visible space when the panel changes.
- If the panel grows again, treat it as a regression.
