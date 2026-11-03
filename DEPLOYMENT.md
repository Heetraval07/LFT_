# How to put the LFT website on Hostinger

This guide is for the person who will set up the website on our **Hostinger Unlimited Web Hosting** account.
You do not need to be a programmer. Follow the parts in order and tick each box as you go.

## How to read this guide

| Label | Meaning |
| --- | --- |
| **[hPanel]** | Something you do by clicking in the Hostinger control panel (hpanel.hostinger.com) |
| **[Google]** | Something you do in the Google account that will send the website's emails |
| **[Website]** | Something you check by opening the website in a browser |
| **[Terminal]** | A typed command. These are only needed if something goes wrong. See Part 13 |
| ⚠ **Not verified** | We could not test this Hostinger feature in advance. Read the note, and if your screen looks different, **stop and ask the developer. Do not guess.** |

**About screenshots:** we cannot open your Hostinger account, so this guide has no screenshots. It tells you the menu
names to look for instead. Hostinger changes its menus now and then, so a name may be slightly different. If you
cannot find something, ask the developer.

**Never** send passwords by email or chat, and never put them in GitHub. Type them only into the Hostinger screens named below.

---

## Part 0. What you need before you start

- [ ] The Hostinger login for our account.
- [ ] The website address (domain) the site will use. For our test site this can be a sub-address such as `staging.ourcompany.com`.
- [ ] A Gmail account that will send the contact-form emails, and its login (we will set up a special password in Part 3).
- [ ] The place the website code lives: **https://github.com/Heetraval07/LFT_**, branch **main**. It is public, so no login is needed.
- [ ] A notepad (paper is fine). You will write down the database details and passwords in Part 1.

**Choose these now and write them down** (use only letters and numbers in passwords. Symbols such as `@` or `#` cause problems):

| Write down | Example | Used in |
| --- | --- | --- |
| Database password | `Kd82hT5qWnV7xB3m` (make your own, 16+ characters) | Part 1 |
| Website admin e-mail | `manager@ourcompany.com` | Part 5 |
| Website admin password | at least 12 characters, e.g. `LftAdmin2026Strong` (make your own) | Part 5 |

---

## Part 1. Create the database **[hPanel]**

The database is where the website keeps its projects and testimonials.

1. Log in to **hPanel**. Click **Websites** in the top menu, then click **Manage** next to our hosting plan.
2. In the left menu, open **Databases** and choose **Management** (it may also be called **MySQL Databases**).
3. Find the box **Create a New MySQL Database And Database User** and fill it in:
   - **MySQL database name:** type `lft`
   - **MySQL username:** type `lft`
   - **Password:** type the database password you wrote down.
4. Click **Create**.
5. Hostinger adds a number in front of the names, so they become something like `u123456789_lft`.
   **Write down the full database name and the full username exactly as shown.**
6. Your **hosting username** is the `u123456789` part. You will need it in Part 2.

Now build the **database address** for later. Replace the three capital parts with your own details:

```
mysql://FULL_USERNAME:PASSWORD@localhost:3306/FULL_DATABASE_NAME
```

Example: `mysql://u123456789_lft:Kd82hT5qWnV7xB3m@localhost:3306/u123456789_lft`

- [ ] I wrote down the database address.

> ⚠ **Not verified:** the exact button names. Hostinger says the address of the database server is normally `localhost` and
> the port is `3306`. The hPanel database page shows these, so check that they match.

---

## Part 2. Create the folder for uploaded photos **[hPanel]**

Photos that staff upload in the admin must be kept in a folder that Hostinger does **not** wipe when the website is updated.
Hostinger replaces everything inside the website's own folders each time it is updated, so uploaded photos must live *next to* them, not inside them.

1. In hPanel, open **Files** and choose **File Manager**.
2. You will see a list of folders. Open the top-level folder (it may be named after your hosting username, or just `home`). It contains a folder called **domains**.
3. Create a new folder **in this same top level**, beside `domains` (**not** inside `domains`, and not inside `public_html`):
   click the **New Folder** button and name it `lft-uploads`.
4. Write down the **full path**. It looks like `/home/u123456789/lft-uploads`. The part `u123456789` is your hosting username.
   The File Manager shows the path at the top of the screen.

- [ ] I created `lft-uploads` beside `domains`, and I wrote down its full path.

> ⚠ **Not verified:** Hostinger does not promise that a website can save files in this folder or that they survive updates.
> **That is why the website tests it by itself** (Part 10). Until the test passes, photo uploading is blocked on the final
> website, and shows a warning on our test website. You do not have to do anything for this to happen.

---

## Part 3. Create the Gmail password **[Google]**

The website cannot use your normal Gmail password. Google makes a special 16-letter password just for this.

1. Sign in to the Gmail account that will send the emails.
2. Go to **https://myaccount.google.com** and click **Security**.
3. Make sure **2-Step Verification** is **On**. If it is not, turn it on first (Google guides you).
4. Go to **https://myaccount.google.com/apppasswords** (or search "App passwords" on the Security page).
5. Type a name such as `LFT website` and click **Create**.
6. Google shows a 16-letter password in four groups, like `abcd efgh ijkl mnop`.
   **Write it down without the spaces:** `abcdefghijklmnop`. Google will not show it again.

- [ ] I wrote down the Gmail app password (no spaces).

> ⚠ **Not verified:** Google may change these screens. Also, some Hostinger plans block mail being sent to Gmail from a
> website. If emails fail in Part 11, see "Plan B for email" there.

---

## Part 4. Create the website application **[hPanel]**

1. In hPanel click **Websites**, then **Add Website** (the **+** button).
2. Choose the option for a **Node.js Web App** (it may be called **Node.js Apps**).
3. Choose **Import Git Repository** (connect GitHub), then:
   - **Repository:** `Heetraval07/LFT_`
   - **Branch:** `main`
4. Check the settings screen carefully:

   | Setting | What to choose |
   | --- | --- |
   | Framework | **Next.js** (Hostinger usually picks this by itself) |
   | Node.js version | **24** (if 24 is not offered, choose **22**) |
   | Root directory | leave as it is (the main folder) |
   | **Build command / build script** | `npm run build:hostinger` |
   | Domain | the website address you chose in Part 0 |

5. **Do not click Deploy yet.** First do Part 5 (the variables). If Hostinger insists on deploying right away, that is
   fine: the first attempt will simply fail because the variables are missing. You will redeploy in Part 6.

- [ ] The application is created.

> ⚠ **Not verified:** whether the screen has a box where you can type the build command `npm run build:hostinger`.
> **This command is important.** It creates the database tables and loads the first data during every update.
> If there is no such box, stop and ask the developer.

> ⚠ **Not verified:** the memory/time limits of the Unlimited plan for the build. If the build stops with an
> "out of memory" or "timed out" message, ask the developer.

---

## Part 5. Add the settings (environment variables) **[hPanel]**

Environment variables are settings that the website reads. They are how you give it the database address, the
email login and the photo folder, **without** putting passwords in the code.

**Where:** open your Node.js application in hPanel. Look for **Environment variables** (it may be in **Settings**
or **Configuration**). Add the following **one at a time**: type the **name** exactly as shown (capital letters, underscores) and the **value**.

### Settings to add for the first update

| Name | Value to type | What it is for |
| --- | --- | --- |
| `APP_ENV` | `staging` | Labels this as our test site. Use `production` only on the client's final site. |
| `DATABASE_URL` | the database address from Part 1 | Connects the website to the database |
| `SMTP_HOST` | `smtp.gmail.com` | Gmail's mail server |
| `SMTP_PORT` | `465` | Gmail's mail port |
| `SMTP_SECURE` | `true` | Use a secure connection |
| `SMTP_USER` | the full Gmail address | The account that sends the emails |
| `SMTP_PASSWORD` | the 16-letter app password from Part 3 (no spaces) | Its special password |
| `CONTACT_RECEIVER_EMAIL` | the address where enquiries should arrive | Who receives contact-form messages |
| `UPLOAD_DIR` | the full path from Part 2, e.g. `/home/u123456789/lft-uploads` | The photo folder |

### Extra settings for the **first update only**

| Name | Value to type | What it is for |
| --- | --- | --- |
| `RUN_SEED` | `true` | Loads the 8 starting projects and their 76 photos into the empty database. |
| `ADMIN_BOOTSTRAP_EMAIL` | the admin e-mail from Part 0 | Creates the first admin login |
| `ADMIN_BOOTSTRAP_NAME` | the manager's name | Name shown in the admin |
| `ADMIN_BOOTSTRAP_PASSWORD` | the admin password from Part 0 (12+ characters) | The first admin's password |

Save after adding the variables.

- [ ] All variables are added and saved. I checked each name for spelling mistakes.

> ⚠ **Not verified:** whether Hostinger makes these variables available **during the update (build)**. The extra settings
> only work if it does. If, in Part 6, the log says `DATABASE_URL is not set`, Hostinger does not pass them to the build:
> use Part 13, "Plan B", or ask the developer.

---

## Part 6. Start the first update (deploy) **[hPanel]**

1. In your Node.js application page, click **Deploy** (or **Redeploy** if it already tried once).
2. Wait. This can take several minutes. Open the **build log / deployment log** to watch.
3. In the log, look for these lines. They mean the first setup worked:
   - `Applying database migrations…` (the database tables were created)
   - `Seed complete. Created: … 8 projects (76 photos) …` (the first projects were loaded)
   - `Created the first admin (…)` (the admin login was created)
4. The update has finished when hPanel shows the application as **Running** (or similar).

- [ ] The deployment finished and shows Running.
- [ ] I saw the three lines above in the log.

**If the update fails:** do not keep clicking Deploy. Copy the last 30 lines of the log and send them to the developer.
Part 12 lists the common problems.

---

## Part 7. Remove the first-time settings **[hPanel]**

This is **important**. Leaving them could bring back projects that staff later delete, and it leaves a password in view.

1. Open **Environment variables** again.
2. **Delete** these four: `RUN_SEED`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_PASSWORD`.
3. Save, then click **Restart** on the application (the **Running** label or a **Restart** button).

- [ ] The four first-time settings are deleted and the application was restarted.

---

## Part 8. Connect the domain **[hPanel]**

The website address must point to Hostinger. What to do depends on where the domain was bought.

**A. The domain is registered with Hostinger**
1. hPanel → **Domains** → click the domain → **DNS / Nameservers**.
2. If it already says it points to Hostinger, you are done. Wait for Part 8 step 5 below.

**B. The domain is registered somewhere else**
1. hPanel → **Domains** → **Add** (or **Connect domain**) and type the domain.
2. Hostinger shows you either two **nameservers** (long names, for example ending in `dns-parking.com`) or an **IP address**.
3. Log in to the company where the domain was bought and either:
   - change the domain's **nameservers** to the two Hostinger shows, **or**
   - add an **A record** pointing the domain to the IP address Hostinger shows.
4. **A sub-address** such as `staging.ourcompany.com` needs only one new **A record** named `staging` (use the IP address Hostinger shows).
5. Wait. A change can take from a few minutes up to 24 hours (sometimes 48).

**Make sure the application uses the domain:** open the application in hPanel → **Domain** (or **Settings**) and confirm it is
the right address. If you added the domain after creating the application, connect it there.

**Turn on the padlock (HTTPS):**
1. hPanel → **Security** → **SSL**.
2. Choose the domain and install the free SSL certificate, then switch on **Force HTTPS** if offered.

- [ ] Opening the website address in a browser shows the LFT website with a padlock.

> ⚠ **Not verified:** the exact names of these menus, how Hostinger links a domain to a Node.js application, and how
> long the changes take. Hostinger's own screens will show the right nameservers or IP address: use those.
> If the site shows a Hostinger "parked domain" page after 24 hours, ask the developer or Hostinger support.

---

## Part 9. First look at the website and admin **[Website]**

1. Open the website. You should see the LFT homepage with a large photo slideshow and a gallery of projects.
2. Click **Our Projects**. You should see 8 project photos. Click one: it should open with a slideshow and gallery.
3. Open **`https://your-address/admin`**. A sign-in page appears. Sign in with the admin e-mail and password from Part 0.
4. In the left menu of the admin you should see: Dashboard, Projects, Categories, Testimonials, Logout. At the bottom it
   shows **Environment: staging**. The Dashboard should say **8 Total projects**.

- [ ] The website, the projects and the admin sign-in all work.

**Sign-in tip:** if the password is typed wrongly 5 times, the admin locks for 15 minutes. Wait, then try again.

---

## Part 10. Prove that uploaded photos are kept **[hPanel] + [Website]**

The website tests this by itself, but it needs **two updates** to find out: the first one writes a note in the photo folder;
the next one checks that the note is still there.

1. In the admin go to **Projects**, click **Add New Project**, and look under **Photos** (do not save anything).
   - On our test site you will see: *"Photo storage is not yet confirmed… treat them as test photos until the website has been redeployed once."*
   - On the final website you will see: *"Photo uploads are waiting for a safety check."* and the button is greyed out.
   - If you see *"Photo uploads are not set up on this server yet"*, `UPLOAD_DIR` is missing, mistyped, or the folder cannot be used.
     Check Part 2 and the `UPLOAD_DIR` setting, and ask the developer.
2. **Update the website once more:** in hPanel open the application and click **Redeploy**.
   Wait for **Running**.
3. Open the same screen again (Projects → Add New Project → Photos). You should now see a green tick:
   **"✓ Photo storage is confirmed safe."**

   This means the photo folder survived an update. Uploaded photos will not be lost in future updates.
4. **Test it for real (on the test site):**
   1. Add a project: type a name and location, click **+ Upload photos**, pick 2 photos, click **Save as draft**.
   2. Click **Redeploy** in hPanel once more and wait for **Running**.
   3. Open that project in the admin. The photos must still be there.

- [ ] The screen says "Photo storage is confirmed safe".
- [ ] A test project's photos were still there after another Redeploy.

**If it never says "confirmed safe":** that means Hostinger may delete the folder on update, or the website cannot write
there. **Do not publish uploads on the final site.** The website keeps working with its existing photos. Tell the developer;
the options are (1) ask Hostinger support which folder is kept between updates, (2) move to a Hostinger plan with permanent
storage, or (3) back up the photo folder after every editing session (Part 14).

> ⚠ **Not verified:** that Hostinger's Unlimited plan keeps files outside the website folders between updates. Hostinger's
> help pages do not say. This test is how we find out.

If something looks wrong there is also: *"Some uploaded photos are missing"* means photos the database needs are gone from the
folder. Uploads pause automatically. Restore the folder from a backup (Part 14) and tell the developer.

---

## Part 11. Check the Gmail contact form **[Website] + [Google]**

1. Open the **Contact** page of the website.
2. Fill in the form with a **different email address that you can read** (for example your personal one), a short message
   (at least 10 characters), and click **SEND MAIL**.
3. You should see a green message: **"Thank you — your message has been sent."**
4. Open the inbox of the address you typed in `CONTACT_RECEIVER_EMAIL`. The message should arrive in a minute.
   **Look in Spam too.**
5. It should say it is from your Gmail address. Click **Reply**: the reply should be addressed to the **visitor's** email (the one
   you typed in the form), not to the Gmail account.

**What the website tells you if something is wrong**

| Message on the website | Meaning | What to do |
| --- | --- | --- |
| "Our contact form is temporarily unavailable" | One of the 4 email settings is missing | Check `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `CONTACT_RECEIVER_EMAIL` in Part 5, then Restart |
| "Your message could not be sent" | Gmail refused the login, or the connection failed | Check the app password has **no spaces** and 2-Step Verification is On; create a new app password if unsure; Restart |
| "You have sent several messages in a short time" | The safety limit (5 messages in 10 minutes) | Wait 10 minutes |

> ⚠ **Plan B for email (not verified):** if Gmail does not work from Hostinger, create an email mailbox in hPanel
> (**Emails** → **Email Accounts**) and use these settings instead: `SMTP_HOST` = `smtp.hostinger.com`, `SMTP_PORT` = `465`,
> `SMTP_SECURE` = `true`, `SMTP_USER` = the new mailbox address, `SMTP_PASSWORD` = that mailbox's password. Then Restart.

- [ ] The test message arrived, and Reply goes to the visitor.

---

## Final checklist

Tick every box before telling anyone the site is ready.

**Website**
- [ ] The address opens the LFT website with a padlock (https).
- [ ] Home, About Us, Our Services, Our Projects and Contacts all open.
- [ ] Our Projects shows 8 projects; one opens with photos and a slideshow.
- [ ] The website looks right on a phone.

**Admin and database**
- [ ] `/admin` shows a sign-in page; signing in works; Dashboard shows 8 projects.
- [ ] Signing out, then opening `/admin` again asks for sign-in.
- [ ] A test project can be added, then published, and it appears on **Our Projects**. Unpublishing hides it. Deleting it removes it.
- [ ] A test testimonial can be added and published, and it appears on the **About Us** page (a "Testimonials" band appears only when at least one is published).
- [ ] Changes appear on the website at once, with no update or redeploy needed.
- [ ] The four first-time settings (`RUN_SEED`, `ADMIN_BOOTSTRAP_*`) were deleted.

**Photo uploads**
- [ ] The Photos screen says "Photo storage is confirmed safe".
- [ ] Photos uploaded to a test project were still there after another Redeploy.

**Contact form**
- [ ] A test message arrived in the right inbox and Reply goes to the visitor.

**Safety**
- [ ] Passwords are only written on paper or in Hostinger, not in emails, chats or GitHub.
- [ ] The admin password is known only to the people who need it.

---

## Day to day

- **Staff add or change projects and testimonials in `/admin`.** They appear on the website straight away. No developer needed.
- **Changes to how the site looks or works** go through the developer: they upload the new code to GitHub, and Hostinger updates the website by itself
  (⚠ not verified: this works if you connected GitHub in Part 4). The database and the uploaded photos stay as they are.
- The first visit after a quiet period can be slow, because Hostinger puts idle applications to sleep. This is normal.

---

## Part 12. If something goes wrong

| What you see | Most likely reason | What to do |
| --- | --- | --- |
| Build log says `DATABASE_URL is not set` | Hostinger did not give the settings to the build | Check Part 5; if the settings are there, use Plan B (Part 13) |
| Build log says it cannot connect to the database | Wrong database address, username or password | Re-check Part 1 and `DATABASE_URL`. Passwords with symbols need special handling: choose a new password with letters and numbers only |
| Website shows an error page after an update | A setting is missing or mistyped | Check each name in Part 5 for spelling, then Restart |
| Admin says "Incorrect email or password" | Typing mistake, or first admin was not created | Check the log for `Created the first admin`. After 5 wrong tries, wait 15 minutes |
| Admin forms do nothing / "Invalid Server Actions request" | Hostinger changes the website address internally | Add a setting `ALLOWED_ORIGINS` with the website address (e.g. `www.ourcompany.com,ourcompany.com`), then Restart |
| Photos message says "not set up on this server yet" | `UPLOAD_DIR` is wrong or the folder cannot be used | Check Part 2 and the setting |
| Photos stay on "not yet confirmed" | The second update has not happened yet | Click **Redeploy** once (Part 10) |
| Contact form errors | See the table in Part 11 | — |

Where to find logs: ⚠ not verified: look in your Node.js application page in hPanel for **Logs** or **Deployments**.
Send the developer a copy of the last lines.

---

## Part 13. Terminal commands (only if needed) **[Terminal]**

You should **not** need these if Parts 1 to 11 worked. They are for the developer, or for "Plan B".

> ⚠ **Not verified:** whether the Unlimited plan gives access to a terminal (SSH), whether it can run these commands, and
> whether the website's settings are visible in the terminal. Look in hPanel → **Advanced** → **SSH Access**.
> Commands are run in the website's **source folder**. If the project's tools are not there, ask the developer.

| Command | What it does | When to use it |
| --- | --- | --- |
| `npm run db:migrate` | Creates or updates the database tables. It only adds things and never deletes data. | Plan B, or after an update that changes the database |
| `npm run db:seed` | Loads the 8 starting projects and 76 photos. It skips anything that already exists, and never changes or deletes existing projects. | Plan B, once, on an empty database |
| `npm run admin:create -- --email NAME@EXAMPLE.COM --name "Full Name"` | Creates an admin, **or resets that admin's password** if the e-mail already exists. It asks you to type a password (12+ characters). Nothing shows as you type. | Plan B, or when a password is forgotten |
| `npm run check:env` | Checks every setting, the database connection and the photo folder. Shows `OK` or `FIX`. It never prints passwords. | Any time you are unsure |
| `npm run storage:check` | Shows whether photo storage is **PENDING**, **CONFIRMED** or **FAIL**. | Same result as the "confirmed safe" message in Part 10 |
| `npm run test:smtp` | Checks the Gmail login and sends one test email. | Only if email will not work |

**Plan B (if the build does not receive the settings)** ⚠ not verified: ask the developer to run, one after another,
`npm run db:migrate`, `npm run db:seed` and `npm run admin:create -- --email … --name "…"`
against the Hostinger database (from the Hostinger terminal, or using hPanel → **Databases** → **Remote MySQL** to allow their computer for a short time).
Then remove the temporary access.

---

## Part 14. Backups (do this before any big change)

You back up **two** things, **together**: the database and the photo folder. The database stores the photo
names; the folder holds the photos themselves.

**[hPanel] Database:** **Databases** → **phpMyAdmin** → open our database → **Export** → **Quick** → **Go**. Save the file.
Hostinger also makes automatic backups (hPanel → **Backups**); use them to restore the database.

**[hPanel] Photos:** **Files** → **File Manager** → right-click the `lft-uploads` folder → **Compress** (zip) → download the zip.

**To restore:** database: phpMyAdmin → **Import** the saved file. Photos: upload the zip to the same place and **Extract**.

The 76 starting photos are part of the code and always come back with every update; only photos uploaded through the admin need backing up.

**Never** delete `lft-uploads`, never move it inside `domains` or `public_html`, and never run any command that mentions "reset".

---

## Later: moving to the client's Hostinger account

When our test site is approved, the same website is set up again on the **client's** account. The code does not change.
Everything that is different (database, email, photo folder, domain) is set with the same **settings** from Part 5.

1. Follow **Parts 0 to 11 again on the client's account**, with these differences:
   - `APP_ENV` = `production`
   - their **own new database**, their own photo folder, their own email settings and domain
   - **do not** use `RUN_SEED`: the content comes from our test site (next step)
2. **Our test site and the client's site never share a database.** Admin logins are not copied either.
3. To copy the projects and testimonials: the developer exports them from our site (`npm run content:export`) and imports them
   on the client's site (`npm run content:import -- --file content-export.json`, then again with `--yes`, after checking the
   database name it prints). Uploaded photos are copied by zipping our `lft-uploads` folder (Part 14) and extracting it into theirs.
   The import skips anything that already exists and never deletes.
4. Photos uploads on the client's site stay **blocked until the second update proves the folder** (Part 10). That is deliberate.
5. Do not do any of this until our test site has been fully approved. Do not change anything on the client's account before then.

---

## List of things we could not check in advance (⚠)

These depend on Hostinger and need to be confirmed during the first setup. If one does not work, stop and ask the developer.

1. The exact menu and button names in hPanel (they change over time).
2. That the Node.js application screen has a box for the build command `npm run build:hostinger`.
3. That the settings (environment variables) are available during the build. Without that, Plan B is needed.
4. That the website can write to the `lft-uploads` folder, and that the folder survives updates. The website tests this itself (Part 10).
5. How a domain is connected to a Node.js application, and how long the DNS change takes.
6. That the Unlimited plan has enough memory for the build, and that GitHub updates are deployed automatically.
7. That a terminal (SSH) is available and can run the Part 13 commands.
8. That Hostinger allows the website to send email through Gmail (the Hostinger mailbox in Part 11 is the fallback).
