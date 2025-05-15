# 📺 Large-Scale Gesture System

## Core Principles
- **BIG MOVEMENTS** - No tiny finger gestures
- **CONTEXT AWARE** - Same gesture, different actions based on what's active
- **HIERARCHY** - Closest/most relevant action wins
- **NATURAL** - Like you're explaining to someone across the room

## Primary Gestures

### 1. BACKHAND SWIPE →
**Primary**: Move object right OR turn page left
**Secondary**: "Yes/OK/Submit" button if available
**Context Priority**:
1. If button is "closest" (z-index) → Click it
2. If object selected → Move it right  
3. Default → Navigate page left

### 2. FRONTHAND SLAP ←
**Primary**: Move object left OR turn page right
**Secondary**: Context-dependent actions
**Same hierarchy logic as backhand**

### 3. PUSH AWAY (Dorky High-Five)
**Action**: Dismiss current focus/modal/overlay
**Motion**: Open palm at chest → push forward
**Use**: Clear the view, get to background layer

### 4. ZOOM IN (Italian Open)
**Motion**: Fists together → spread wide past shoulders
**Note**: Big movement = controlled zoom (not 1:1)

### 5. ZOOM OUT (Italian Close)  
**Motion**: Hands open at shoulders → bring together
**Inverse of zoom in**

### 6. ROTATE (Basketball Palm)
**Motion**: Hand spread like palming ball → rotate
**Direction**: Clockwise/counter based on rotation

## Gesture Hierarchy Example

```
User makes BACKHAND gesture →
  
1. Check: Is there a submit button visible?
   → YES: Click submit
   → NO: Continue...
   
2. Check: Is an object selected?
   → YES: Move object right
   → NO: Continue...
   
3. Default: Navigate page left
```

## Context Zones (Z-layers)

```
Z-100: UI Controls (buttons, menus)
Z-75:  Modals, overlays
Z-50:  Selected objects
Z-25:  Canvas/whiteboard
Z-0:   Background/navigation
```

## Compound Gestures

**Document Reading Flow**:
1. Reading document (focused)
2. PUSH AWAY → Document minimizes
3. BACKHAND → Pan workspace left
4. See other documents

## Design Principles

1. **No Finger Counting** - All fingers = one thing
2. **Big & Clear** - Visible from 10 feet
3. **Natural Flow** - Like Italian conversation
4. **Context Smart** - Right action for situation
5. **Forgiving** - Easy to correct mistakes

## Next Gestures to Define

- [ ] Select/grab object
- [ ] Drop/release object  
- [ ] Undo/redo
- [ ] Menu open/close
- [ ] Scroll up/down
- [ ] Multi-select

## TV UI Adaptations

- Huge hit targets
- Visual gesture preview
- Audio feedback
- Gesture tutorials
- "Thinking" indicators

---

"Think big, move big, Italian hands!" 🤌🤌
