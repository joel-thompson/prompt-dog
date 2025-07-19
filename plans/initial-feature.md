# Project Description

This project is a web application that allows users to test prompts for AI models.

# Features

Input box with the user's prompt (gets inserted into the prompt template).

Button to send the prompt to the AI model (uses the prompt template and the user's prompt).

Dropdown to select the prompt template.

Button to select how many times to run the prompt (1-5, will change in the future).

Once the prompt is sent, the user should see the results of the prompt. This will include:
- The prompt that was sent.
- The text response from the AI model.
- The time it took to generate the response.
- Any logs associated with the prompt (api will return logs and the final response)

If a user has chosen to run the prompt multiple times, the user should see the results of each run in tabs.

Prompt templates will be hard coded for now.

# Future Features

These are out of scope for now, but keep in mind as they will need to be supported in the future.

Prompt templates will be stored in the database.