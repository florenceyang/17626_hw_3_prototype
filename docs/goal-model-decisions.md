# Goal Model Decisions (Step 2)

Conflicts

- G7 \> G207 \- prioritize explaining the terms instead of short questions. It’s more important for the client to understand difficult legal jargon than to keep it simple and vague.
- G68 \> G134 \- prioritize keeping safety-sensitive situation hidden over handling how a helper fills out the form. Assume the helper is already trusted / authenticated in real life, so no need to over-engineer with technical solutions to handle this authentication through the form (This is understanding the scope of the environment vs. machine).
- G10 vs G313 \- compromise between resuming saved form over being able to have intake started without a login. To satisfy both goals, if a user wanted to resume or save progress on a form, they would need to create a login. However, they can still start the form without a login and fill it out to completion in one go.

Overlaps

- G156, G312, G404 \- Combined these goals under G207 since they are all related to questions in the form.
- G139, G140, G151 \- Combined these goals under G138 since they are all related to info to be shown on the confirmation screen
- G9, G318, G95 \- Removed G9 because detecting contradictory answers in the form would be hard-to-measure, so kept the goal model only focused on concrete, measurable goals
- G323, G335, G157 \- Removed G335 since it’s not normal to include details about benefit agencies in the disclosure. Combined G323 and G157 since they are both related to the disclosure blurb.
- G81, G267 \- Resolved by combining G81 and G267 since they are both related to the court-date input.
