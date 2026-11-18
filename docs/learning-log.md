# 1 - Sprint Planning and Requirements Selection

| Goal selection

We chose to focus on the subset of goals that would encapsulate the intake form
experience.

Core - The intake form is a core aspect of the legal intake process. All
downstream flows and decisions later in the process (i.e. triage process,
attorney review, etc.) depend on what's inputted in the intake form. So building
out this experience would allow us to incorporate the various goals of the
different stakeholders from the first step. This allows the form to focus not
only on the client's experience, but also builds the form to be tailored in a
way that's useful for information extraction by the paralegal and attorneys (who
respectively have different needs from the intake form as well).

User-facing - This feature is user-facing since it is the first
interaction that clients will have with the legal aid intake process. They need
to fill out the form and interact with all the buttons and UI to enter the
crucial information for downstream processing in the intake process. In our
subset of goals, we've also mocked how the form will affect the output shown to
the legal team (in a simplified MVP) to demonstrate how the specific goals
incorporated affect the end-to-end flow of the legal intake process.

Uncertain - There is a good amount of uncertainty with this area since what the
client wants / expects out of the intake form is different than the legal team's.
When flushing out the prototype, we often needed to make tradeoffs between
being simple and easy-to-understand for clients, while making sure the form was
asking for specific-enough information and documents that the legal team needs.

Scope - To ensure this was a small enough scope, we removed the staff triaging
goals and any phone-intake-related goals from the prototype. This allowed us to
specifically focus on the input flow, which had many conflicts and tradeoffs we
needed to consider between the different stakeholders' goals already. This also
allowed us to test more edge cases and flows within the tight scope without
getting distracted from other functionality.

| Requirements resolutions

Detailed in docs/goal-model-decisions.md

# 2 - Prototype Evaluation

The main gaps in prototype v1 came from requirements issues. After interacting
with the prototype, I would realize there were edge cases or flows I did not
consider. These would need to be added as additional requirements since those
details are assumptions/rules I am aware of that the model cannot predict/guess.

Interacting with the prototype also allowed me to see firsthand the conflicting
perspectives and goals of the different stakeholders. Going through the form
helped me understand Gloria's need for a simple form since it can easily get
overwhelming to enter a lot of information and documents. This directly
contrasted with seeing how the legal team's need for detailed information and
court-specific documents can easily complicate the process and understanding
for the client.

1. Requirement 3, Requirements Issue - Did not flush out in detail enough how to cover
   security when a user is logged in (i.e. if information is saved, how to hide
   in a dangerous situation if stored in browser)
2. Requirement 5, Requirements Issue - Realized as I was interacting with the
   prototype that we may want a different flow if the user answers they are in
   danger. Can't apply blanket user flow to all situations, should deviate based
   on answers to questions - need to add more requirements to specify this.
3. Requirement 6, Implementation defect - If there's follow-up questions, the
   "next question" doesn't accurately show this. It just assumes there's no follow-
   ups and lists the general next question.
4. Requirement 12, Requirements Issue - Need to add details in requirements for
   error handling (when notice date later than court date, input error).
5. Requirement 13, Requirements Issue - need to specify that the label "reported
   by applicant, not verified" should only be shown to staff, not clients when
   filling out the form.
6. Requirement 15, Requirements Issue - Need to specify that multiple documents
   can be uploaded for one type of document needed. Current implementation only allows
   upload of one file and replaces it if another file added.
7. Requirement 16, Requirements Issue - Need to specify more detail for what
   retake / replace document flow should look like. Currently just removes the file,
   which goes against user expectations. It should re-prompt users to upload another
   document.
8. Requirement 18, Implementation defect - Missing login option on document
   upload, review, and confirmation screens.

# 3 - Revisions and Learning

After evaluating v1, I revised the requirements and prototype together rather than treating each gap as a visual fix:

- I made the question flow respond to answers. Deadline and danger questions come first, conditional follow-ups affect the actual next step, and a “Yes” or “I’m not sure” danger answer triggers an urgent-review notice. When someone is helping the applicant, danger answers are handled in a private step and are not shown on later screens.
- I clarified how to handle dates and documents. The form explains when the court date is before the notice date, supports multiple photos for one document type, and keeps the existing file until a replacement is selected.
- I kept starting and submitting a request account-free, while adding account prompts for saving progress and checking status. Applicants can also create or log in to a simulated account from the confirmation screen.
- I added and updated tests around these flows, with scenario and requirement IDs in test names so the traceability check can connect requirements to tests.

I learned that many v1 gaps came from distinctions the requirements had left implicit: routine versus urgent requests, an applicant versus a helper, reported information versus verified information, and anonymous use versus account-based saving. Writing those distinctions as explicit rules made the intended screen behavior and the cases to test much clearer.

# 4 - Reflection

Building v2 helped me see how competing goals shape even small interaction choices. Asking safety questions early can help staff identify urgent cases, but those answers also need extra privacy protections, especially when another person is helping. Similarly, accounts can support saving and status checks, but requiring one would add effort and could discourage someone from submitting a request. Keeping submission anonymous and making account use optional was a deliberate balance, not just a simplification.

I also learned that a prototype can make assumptions visible, but it cannot establish that the experience is safe or usable in practice. The account and storage behavior is simulated in the browser, and the usability-results sheet does not yet contain participant results. I therefore cannot claim that the revised flow has been validated with users or is ready for real legal-aid information. The next step is to run the planned fictional-scenario usability checks and review the safety, privacy, and document language with legal-aid staff before treating these decisions as settled.
