# Custom Jeopardy

A Jeopardy board that runs in Chrome. The game page is `index.html`. The clues are in `board.txt`.

## Which copy to download

| Branch | Board | Use it for |
| --- | --- | --- |
| [`main`](https://github.com/The-Allsparks/custom-jeopardy/tree/main) | Classroom Jeopardy | Science, history, and other school topics |
| [`ftc-biobuzz`](https://github.com/The-Allsparks/custom-jeopardy/tree/ftc-biobuzz) | FTC BIOBUZZ | 2026–2027 FIRST Tech Challenge review |

Download the branch you want:

- Classroom: https://github.com/The-Allsparks/custom-jeopardy/archive/refs/heads/main.zip
- BIOBUZZ: https://github.com/The-Allsparks/custom-jeopardy/archive/refs/heads/ftc-biobuzz.zip

Unzip the folder. Open `index.html` in Chrome. Keep `index.html` and `board.txt` in the same folder. The page on GitHub will not run the game; it has to be opened from the downloaded folder.

If you use git:

```
git clone https://github.com/The-Allsparks/custom-jeopardy.git
cd custom-jeopardy
git switch ftc-biobuzz
```

Leave off the last line to stay on the classroom board.

## Play a game

1. Open `index.html` in Chrome.
2. Jeopardy deals 6 categories. Double Jeopardy deals 6 different ones. Each column shows 5 clues, easier at the top and harder at the bottom.
3. Click a value. The answer appears, and players respond with a question.
4. Click the screen, or press Enter or Space, to show the question.
5. Click again to return to the board. That clue stays dark.
6. When every Jeopardy clue has been played, a Double Jeopardy card appears. Click it to deal the next board. After the last clue, the final scores fill the screen.

On the answer screen, Escape puts that clue back on the board. Enter, Space, or a click still moves ahead.

The menu's Judge window shows the response on your laptop while the projector stays on the board. The response is also printed in the console on a line that starts with `[Judge]`.

Refreshing the page keeps the current game. Closing the tab and opening the page again deals a new board. Click the title and confirm to deal a new game now.

## Keep score

Open the menu at the top right. Credits introduces The Allsparks, FTC team 36117, with links to [theallsparks.org](https://www.theallsparks.org) and the [donate page](https://www.theallsparks.org/support-us/donations). It also notes that the team is fiscally sponsored by Hack Club, a 501(c)(3), and lists the disclaimer, thank-yous, citations, sources, and repository links.

- Click a color to add a team. The colors are red, blue, green, yellow, orange, purple, pink, and white.
- Remove a team from the same menu.
- Scores show in the header.
- On a clue, **+** adds that clue's value and moves ahead one step. **−** subtracts that value and stays on the screen.

Teams stay in this browser. A new deal sets every score back to zero and keeps the teams. The leader's score is outlined in gold.

## Host a room

Buzzers and the judge window run on the hosted board. A copy opened from a folder still keeps score on the projector.

Add at least two teams. A buzzer QR code appears. Each phone joins that room, types a short team name, and picks a color. The name shows on the score bar and on the buzz banner.

The first buzz locks the other phones and starts a five-second clock. The clock does not change the score. Click the banner, or press R, to reopen the buzzers. A wrong answer locks that team out until the next clue. The banner lists who has joined and who is already out.

Judge window, in the menu, opens the response and the score buttons beside the projector. While that window is open, the board hides the + and − buttons.

## Music

Think music plays while the answer is on screen. A file named `Jeopardy - 1997 - Think Music.mp3` next to `index.html` is used when you have it. That file is not in this repository. The hosted board plays the Internet Archive copy instead: [Jeopardy - 1997 - Think Music](https://archive.org/details/tvtunes_29826).

Turn music off in the menu, or press M. The board still works if the music cannot play. If neither copy can play, the menu links to the Archive page.

## Edit the clues

Open `board.txt` in a text editor. Leave the first line, `const BOARD =` followed by a backtick, and the last line, a backtick followed by a semicolon, as they are.

```
TITLE: Your Game Name

CATEGORY: Category Name
The answer shown first | The question shown second
Another answer | Another question
```

- One `CATEGORY:` line per category.
- Each clue is `answer | question`, with a space, a pipe, and a space between the parts.
- Put easier clues first and harder clues last.
- Use at least 15 clues in a category. More than 15 is fine. With 15 clues, the five dollar values draw from clues 1–3, 4–6, 7–9, 10–12, and 13–15. A longer list stretches those same five bands across every clue.
- Use at least 12 categories so both rounds can fill 6 columns. With fewer categories, Double Jeopardy uses whatever is left. With 6 or fewer, only Jeopardy is dealt.
- Lines starting with `#` are comments.
- A dollar amount at the start of a line is ignored. `200 | answer | question` is read as `answer | question`. The board assigns the dollar values from where the clue sits in the list.
- An optional source is shown on the question page: `answer | question | citation | https://link`

Save the file, then refresh Chrome. Changing `board.txt` starts a fresh deal.

## GitHub

Repository: https://github.com/The-Allsparks/custom-jeopardy

`main` holds the game page and the classroom board. `ftc-biobuzz` is that same page plus the BIOBUZZ board. Edit `board.txt` on the branch you want to change, then push that branch.
