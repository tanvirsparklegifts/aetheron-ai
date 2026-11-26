# Supabase setup for AETHERON

## Project configuration

- Project URL: set as `SUPABASE_URL` in the Cloud API service.
- Publishable key: set as `SUPABASE_PUBLISHABLE_KEY` only where a Supabase client needs it. It is not a substitute for user authentication or Row Level Security.
- Never put a secret key, service-role key, database password, or provider key in the web app or Git repository.

## Create the initial database schema

1. Open the AETHERON Supabase project.
2. Open **SQL Editor** and choose **New query**.
3. Copy the complete contents of `supabase/migrations/001_initial_schema.sql` into the editor.
4. Review the SQL and click **Run**.
5. Confirm that the Tables list contains `profiles`, `conversations`, `messages`, and `memories`.

The migration enables Row Level Security and adds owner-only policies. It does not create an Auth user or connect the running API by itself.

## Next integration steps

1. Configure Supabase Auth and decide the allowed sign-in methods.
2. Add a browser Supabase client using the project URL and publishable key.
3. Verify Supabase access tokens in the FastAPI service before accepting user-scoped requests.
4. Pass the verified user identity into every database operation; never trust a user ID supplied in a request body.
5. Add automated tests for cross-user isolation before enabling conversation or memory persistence.

Do not store passwords, API keys, wallet seed phrases, government identity numbers, or other secrets in the memories table. Memory should be opt-in and user-deletable.
