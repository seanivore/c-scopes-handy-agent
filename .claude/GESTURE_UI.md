# Gesture UI Planning 

## No Hand Gestures 

I'm not okay with the current use of small hand gestures to control computer interactions. We initially thought about thumbs up and one finger and things like that. And Alan seems to be on the same "small gesture" train. I'm here to turn that idea on its head. 

**When you think "gestures" don't think about hands, think about Italian people using their arms and body to communicate.**

### Interface Response Reliability 

Big movements are natural and, my biggest concern, very unlikely to be mistaken for another gesture. On the few hand gesture mock-ups we made, the AI was rattling off accurate and inaccurate gestures in a constant stream with less than 50% accuracy. UX being super careful just isn't useful. 

### Interface Longevity 

Consider that the XBox Kinect has been around for a long time and today new game systems, even some TVs, have front cameras. Our big movements will not only ensure we trigger the command we want, but will naturally flow into the UX when using applications displayed on a television. 

## Gesture Interface Design 

I don't think we want to plan out every gesture's result until it is needed, unless there is an obvious conflict or pattern to follow through. Here are some of the basics that we can probably safely confirm. 

### MOVE OBJECT RIGHT --> **BACKHAND** 

### MOVE OBJECT LEFT --> **FRONTHAND** 

For scrolling horizontal, flipping a page, moving a page left or right, or maybe swiping away an option in a pile of choices. 

### CONFIRMATION, OKAY, SUBMIT, ETC. --> **BACKHAND** *SECONDARY USE:* 
  - The backhand, swipe right is a natural way to say yes; submitting a form, agreeing with an Agent's proposal. 
  - Let's get the logic for secondary use of gestures down early. 
  - It is going to happen more than a few times in the future as we built out a way to interact with an OS. 
  - It would also work for next suggestion; we need to be thinking CONTEXT AWARE 
  - We should also think of it like a hierarchy 

Imagine there is an option available for you. It is "at Z 100" in CSS layer terms. It is conceptually closest to you based on the context of the interaction that is happening. This is when the **BACKHAND** gesture would work for the button to submit, hit next, activate the test run, instead of the page or an object moving. 

### RIGHT CLICK ALTERNATE USE --> **HIGH FIVE**

To make the alternate, conceptually distant result happen, pivot away from this "closes" gesture result, we can do a sort of dorky **HIGH FIVE**: Palm open, hand in front of chest, push directly forward away from you towards the screen. This pushes something that was at-the-ready away. You don't want to click "Submit" on the form and instead want to move the page to see what is to the left of the form. 

This can be applied in any multi-use gesture when you need to activate use a lower hierarchy gesture result. We'll have more examples to come, just remember when you feel "but I don't want to do X" then high five or "push" it away. 

### ROTATE OBJECT CLOCKWISE OR COUNTER-CLOCKWISE --> **FINGERS WIDE, PALM FORWARD, HAND TWIST** 

Imagine you are trying to palm a basket ball. But that palm is facing forward. And as if it is on a big sheet of paper, when you turn the hand you rotate the object. Simple as that. 

This is all we will need for the first phase of the project. 

## In Summary 

These are cute and colloquial, but they will not make for an enjoyable user experience, and in the end, the larger motions will even feel more natural. 

👍 Thumbs up 
✌️ Peace sign
👋 Wave
👉 Point
✊ Fist