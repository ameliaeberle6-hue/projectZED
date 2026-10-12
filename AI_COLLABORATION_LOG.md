# AI Collaboration Log

Date: October 12, 2026

This log summarizes the conversations between Mia and the AI assistant while building **Before I Walk**. The AI made changes only in response to Mia's requests and checked the page in a browser as features were added.

| User request or decision | AI contribution |
| --- | --- |
| Read the project plan before suggesting or building features. The plan was supplied in chat because `PLAN.md` was initially missing. | Read the supplied plan and implemented its first feature: a graduation date picker and countdown, with browser-local saving and accessible status messages. |
| Add the list of things to do before graduation. | Added a tagged bucket-list form and displayed/saved the new items in localStorage. |
| Add a school assignment section. | Asked what assignment details to track. After Mia chose name, due date, and completion, added a saved assignment list with checkboxes. |
| Add a way to tell whether the bucket list can be finished before graduation. | Added a pace summary based on list start date, graduation date, and completed bucket-list items. Added checkboxes to bucket-list entries so completion can be tracked. |
| Adjust the graduation-cap decoration and make it much larger, then move it down and left/right through several small iterations. | Updated the CSS cap size and position after each requested adjustment, keeping the page title centered. |
| Add the attached Super Frog image with the frog wearing the graduation cap. | Asked permission before adding the image file, then placed the mascot above the title with the cap over his head. |
| Remove the white image background. | Asked whether to edit the image or hide the background with CSS. After Mia chose transparency, removed the edge-connected white background while preserving white details inside the frog. |
| Show a percentage in the pace section, then remove “100% of time left,” the “Am I on pace?” heading, and “On pace!” wording. | Added the bucket-list completion percentage; removed the time-left percentage; renamed the section “Bucket list progress” and changed the positive status to “You're on track!” |
| Use August 24, 2026, the first day of school, as the start date for comparing bucket-list progress with graduation. | Updated the pace calculation to use August 24, 2026, including for records that were already saved with a different list-start date. |
| Include both bucket-list items and school assignments in pace tracking, then remove the confusing weekly-rate recommendation. | Updated pace totals to count both lists and removed the “Do about X items a week” sentence; the message now shows completed task count and ahead/behind status. The bucket-list percentage still reflects only bucket-list completion. |

The app remains a static HTML, CSS, and JavaScript project. Its settings, bucket-list items, and assignments are stored in the browser's localStorage; no API or network data is used.