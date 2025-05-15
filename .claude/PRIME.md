# Context Priming 

Read the following documents to understand the context of the project and the initial thoughts on how to move forward. 

Run the following command: 

```bash
ptree
```
## Context 

I was chatting with a developer on Twitter who is using visual AI intelligence and computer front camera to interact with elements, creating games and more. My immediate thought was "hrm, well we need 5G edge for VR/AR to actually, finally become a thing ... but ... oh, well as AI gets better and better at recognizing visuals, so ... "let's make games, teach me!" 

## Understanding The Potential 

You were impressed by their Three.js Hand Tracking 101 repository and we immediately starting building things and trying to connect the use of SFA into the use-cases of the interactive potential of the technical functionality. 

[Simple Ball Size Control](https://collidingscopes.github.io/threejs-handtracking-101/)

## Building The Foundation 

You helped me get the above working and put together some information and thoughts about the potential for bridging the use-case gap between tracking and python agents. 

[Technical Details](../README.md)

## Gesture Interface Design 

Get the basics about what a gesture for our technology really looks like; the way you interface with the ball in the Three.js Hand Tracking 101 file is not a good example for the big picture. 

[Gesture Interface Design](./GESTURE_UI.md)

## Where Gestures, Application, and Agents Meet 

Review this document to understand the natural flow of logic that helped identify use-cases, agentic purpose, and eventually our most sensible first steps. 

[Gesture + Voice = Navigation + Input](../docs/SFA_UI_OPTIONS.md)

1. **Solved the input problem** - Gestures for navigation, voice for complex input
2. **Created a unified vision** - The figjam-style board that works for both planning AND agent workflows
3. **Listed concrete applications** - From day planners to video editors
4. **Identified smart constraints** - Avoiding granular stuff like coding (delegate to agents instead)
5. **Set clear priorities** - Start with games, specifically Tetris 

Application & The Agent
- The two-board system (your projects + agent planner) with the cop-knock switching
- Using actual documents/previews on the board (tangible!)
- Agent orchestrator with parallel processing

Starting with Tetris 
- Limited gesture set needed (left, right, rotate, drop)
- collidingScopes already has gesture Tetris
- Perfect for perfecting core interactions
- Fun and immediately understandable 

