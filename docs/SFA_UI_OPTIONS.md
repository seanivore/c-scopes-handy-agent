# Gesture-Controlled

Many of these are ways to interact with applications rather than agents. So let's think about what tooling we can provide agents that would fit the UI and fulfill a common need. 

## Gesture + Voice = Navigation + Input 

I'm thinking that the best fit for SFA so far is helping you from inside an application that the UI is a strong fit for. Then when something is identified, we'd use voice to relay the task to the agent, or even convey a bigger project that they can then map the workflow. 

## Conceptually Low-Fidelity App 

Making things tangible for us in a productive way, and for us to oversee the process of project planning that agents are creating for a workflow. The obvious direction here is a 'figjam' style grid whiteboard because you can have assets distributed in various ways: Groups, Lists, Charts, Flows, Diagrams, etc. You can be managing multiple projects on the same board. Maybe a "hand clasp" and then showing a number of fingers that represents one of the projects on the board could jump you to that project. This way you can show and convey contextual information to the agent, when explaining the project they are to orchestrate. 

This is where the secondary value comes in, the agent can plan the workflow in the same application. Maybe you change tabs by banging on a door like a cop with the pinky side of your clenched fist; bang twice and it jumps to the Agent Planner. Again twice and back to your projects. The agent planner would primarily be a flow chart. You would be able to have one highlighted to start and you swipe through them. Then zoom in on the one you want. It would be a formalized UI version of a JSON object variable fields, thus the flow chart illustrating branching, decisions, etc. We would have icons like a human for check points, something for decisions, something for workflow adjustments, token count, etc. all the good stuff we already have built into the SFA. 

## Defining the Applications 

Higher conceptual fidelity of an application idea could be pretty broad, and probably should be developed that way. Breakdown the many different utilities this interface could provide, then implement any necessary "widgets" to support the workflow. 

### Day Planner 

Tasks become tangible when you can put the actual document or preview of the video you are editing right on the board. 

### Meeting Calendar 

Scrolling through a calendar would feel natural with gestures. "Widgets" (for lack of a better term yet) would need to be in the form of friend requests. When onboarding to the app you get a photo taken, an avatar is created. Since people don't like to take the photo in the moment for PFPs, we can add some filtering and basic adjustments to the agent's current photo editing tool. 

### Others 

- Document Processor: For research and analysis, comes with charts and tables. 
- Presentation Builder: Glorified Powerpoint. 
- Music Editor: So natural for a synth and editing the timeline. 
- Video Editor: Same as music editor, but for video. 
- Image Editor: Could be a dual option thing where you can choose options for the agent to do the editing, or you can just edit yourself. Maybe we stick to the agent doing it to be clean with the concept. Similarly, image generation. 
- Games, so many games 
- Mapping for planning trips 
- That universe simulator that Anton is always talking about being free would be fun to play with 
- Blender -- the API might make this straight up doable 

### Challenging Potentially Avoided Applications  
- Actual coding: I think when we get sort of "granular" like this, it means we need to take a bigger picture, higher viewpoint, plan out the project and then hand it off in full to a whole crew of agents. 
- Actual writing: We can easily dictate to an agent, but again it seems like the better approach would be planning out the project, maybe even with a flowchart for the story of the writing, then delegating it. 

### Head Start Research To Do 

- XBox has had a Kinect forever so what apps do they already have? 
- What kind of app pieces can we find on GitHub 
- Gesture based games 
- Feels like we should ask Perplexity all these things 


## Thinking About Agents 

We need to implement the LiteLLM because I don't think we want to be making the files bigger and bigger. The main agent that 'follows you around' the app is the main orchestrator, who then delegates tasks to the other agents (yay parallel processing) depending on what is needed. Web research versus image generation. This also opens up planning out models, so that we can make sure Gemini 2.5 Pro is used a lot because FREE and huge context, for writing out research insights from processing large amounts of collected information. 

### Agent Orchestrator 

This is part of the planned Phase IV update for the SFA. 

### Agent Skill Review 

We need some kind of dropdown visual somewhere so that when we need something to get our brain going, we can look at the skills and be like "oh, this is a thing that I can do". 

## Where To Start 

Games. Economically entertainment is just always the place to start. 

  - How can we alter scrabble, or other word games, so that you use the agent as a resource? 
  - Generally speaking, contemplating the role of the agent as a resource is a big question that will probably just click. 

### Tetris

It is a classic. It only needs the most important, core UI gestures which is perfect opportunity to perfect them. Plus Alan (I just looked at his name on GitHub) has a gesture based Tetris repo ready to go. this seems like an obvious head start. 

## Next Steps 

Organize the mess of documents. 
Formalize the necessary gestures. 
  - Seems logical to only create gestures as needed 
  - Unless something is super obvious or might have conflict otherwise 
Clone (or fork) the Tetris repo and see where we are at 
Ignore the role of SFA for now to just ge these first steps going. 