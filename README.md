# Nokia 3310 Snake II - Retro Web Game

An authentic recreation of the legendary **Nokia 3310 Snake II** mobile game built with vanilla HTML5, CSS3, and JavaScript (Canvas & Web Audio API).

## Features

- **Authentic Nokia 3310 Hardware Emulation**:
  - Detailed 3D Nokia 3310 chassis with metallic speaker grill, screen glare, brand logo, and tactile button depression physics.
  - Interactive on-screen keypad with realistic button click sounds.
  - 5 Customizable phone shells: **Classic Navy Blue**, **Cyber Silver**, **Retro Yellow**, **Ruby Red**, and **Matrix Green**.
- **Retro Monochrome Dot-Matrix LCD**:
  - Pixel-perfect LCD grid styling with authentic subpixel texture.
  - 4 Backlight illumination modes: **Classic Green**, **Ice Blue (3315)**, **Amber Glow**, and **True B&W**.
- **Faithful Nokia Snake II Gameplay**:
  - **4 Game Modes**:
    - *Snake II (Wrap-around)*: Pass smoothly through borders.
    - *Classic (Snake I)*: Strict wall collision.
    - *Labyrinth*: Vintage maze wall layout.
    - *Box*: Corner obstacle challenges.
  - **Bonus Insects / Bugs**: Special crawling insects appear every 5 apples with a live countdown timer bar and extra points.
  - **9 Speed Levels**: From beginner-friendly crawl to lightning-fast reflex testing.
  - **High Score System**: Automatic persistence in `localStorage`.
- **Pure Web Audio API Synthesizer**:
  - Vintage piezoelectric buzzer emulation (square wave chirps, bite beeps, crash buzz, and the iconic Nokia ringtone motif when achieving high scores!).
  - In-game sound toggle (* key or on-screen button).

## How to Play

### Controls
| Action | Keyboard | Phone Keypad |
| :--- | :--- | :--- |
| **Move Up** | `↑` or `W` | `2` or `▲` button |
| **Move Left** | `←` or `A` | `4` or `◀` button |
| **Move Right** | `→` or `D` | `6` or `▶` button |
| **Move Down** | `↓` or `S` | `8` or `▼` button |
| **Start / Pause** | `Space` or `Enter` | `Navi Key` or `5` |
| **Menu / Back** | `Esc` or `Backspace` | `C` button |
| **Toggle Sound** | `*` | `*` button |
| **Switch LCD Theme** | `#` | `#` button |

*Mobile touch swipes directly on the LCD screen are also fully supported.*

## How to Run the Game

You can run this game using any of the following methods:

### Method 1: Direct File Open (Quickest & Easiest)
1. Navigate to the project folder on your computer:
   `c:\Users\Dell\OneDrive\Desktop\Snake game\`
2. Double-click on **`index.html`** (or right-click -> **Open with** -> **Google Chrome**, **Microsoft Edge**, or **Firefox**).
3. The game will launch directly in your default browser. No internet or terminal commands required!

---

### Method 2: Using Python (Local Web Server)
If you prefer running via a local development server:
1. Open PowerShell, Command Prompt, or Terminal in the project directory:
   ```bash
   cd "c:\Users\Dell\OneDrive\Desktop\Snake game"
   ```
2. Start the built-in Python HTTP server:
   ```bash
   python -m http.server 8080
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

---

### Method 3: Using Node.js / npx
If you have Node.js installed:
```bash
npx serve .
```
Then open the local URL shown in your terminal (usually `http://localhost:3000` or `http://localhost:5000`).

---

### Method 4: Using VS Code Live Server Extension
1. Open this folder in VS Code or your IDE.
2. If installed, right-click **`index.html`** in the Explorer sidebar.
3. Select **"Open with Live Server"**.

---

> [!TIP]
> **Sound Activation**: Modern web browsers require a user interaction before playing audio. Simply click or tap any button on the Nokia phone or press any key on your keyboard to activate the vintage 8-bit sound effects.

