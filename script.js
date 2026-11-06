const screens = [...document.querySelectorAll('.screen')];
const progress = document.getElementById('progress');
const stepLabel = document.getElementById('stepLabel');
const playfulMusic = document.getElementById('playfulMusic');
const letterMusic = document.getElementById('letterMusic');
const cheerSound = document.getElementById('cheerSound');
const fartSound = document.getElementById('fartSound');
const audioFadeTimers = new WeakMap();
const backgroundMusicVolume = 0.7;
let current = 0;

playfulMusic.volume = 0;
letterMusic.volume = 0;

function fadeAudio(audio, targetVolume, duration, onComplete) {
    const existingTimer = audioFadeTimers.get(audio);

    if (existingTimer) {
        clearInterval(existingTimer);
    }

    const startVolume = audio.volume;
    const volumeChange = targetVolume - startVolume;
    const startTime = performance.now();
    const timer = setInterval(() => {
        const progress = Math.min((performance.now() - startTime) / duration, 1);
        audio.volume = startVolume + volumeChange * progress;

        if (progress === 1) {
            clearInterval(timer);
            audioFadeTimers.delete(audio);

            if (targetVolume === 0) {
                audio.pause();
            }

            if (onComplete) {
                onComplete();
            }
        }
    }, 40);

    audioFadeTimers.set(audio, timer);
}

function playPlayfulMusic() {
    if (!cheerSound.paused || !fartSound.paused) {
        return;
    }

    playfulMusic.play().then(() => {
        if (shouldPlayBackgroundMusic()) {
            fadeAudio(playfulMusic, backgroundMusicVolume, 700);
        } else {
            playfulMusic.pause();
        }
    }).catch(error => {
        console.warn('Could not play playful background music:', error);
    });
}

function playLetterMusic() {
    if (!cheerSound.paused || !fartSound.paused) {
        return;
    }

    if (!letterMusic.paused) {
        fadeAudio(letterMusic, backgroundMusicVolume, 700);
        return;
    }

    const existingTimer = audioFadeTimers.get(letterMusic);
    if (existingTimer) {
        clearInterval(existingTimer);
        audioFadeTimers.delete(letterMusic);
    }

    letterMusic.volume = 0;
    letterMusic.play().then(() => {
        if (shouldPlayLetterMusic()) {
            fadeAudio(letterMusic, backgroundMusicVolume, 700);
        } else {
            letterMusic.pause();
        }
    }).catch(error => {
        console.warn('Could not play letter background music:', error);
    });
}

function shouldPlayLetterMusic() {
    return current === 1 || current === 2 || current === screens.length - 1;
}

function shouldPlayBackgroundMusic() {
    return Boolean(
        screens[current].querySelector('.question, .surprise-note')
    );
}

function syncScreenMusic() {
    if (shouldPlayLetterMusic()) {
        fadeAudio(playfulMusic, 0, 700);
        playLetterMusic();
    } else if (shouldPlayBackgroundMusic()) {
        fadeAudio(letterMusic, 0, 700);
        playPlayfulMusic();
    } else {
        fadeAudio(letterMusic, 0, 700);
        fadeAudio(playfulMusic, 0, 700);
    }
}

function resumeMusicAfterSound() {
    syncScreenMusic();
}

cheerSound.addEventListener('ended', resumeMusicAfterSound);
fartSound.addEventListener('ended', resumeMusicAfterSound);

function playReactionSound(sound, name) {
    fadeAudio(playfulMusic, 0, 700, () => {
        sound.currentTime = 0;
        sound.play().catch(error => {
            console.warn(`Could not play the ${name} sound:`, error);
            playPlayfulMusic();
        });
    });
}

function showScreen(n) {
    screens[current].classList.remove('active');
    current = n;
    screens[current].classList.add('active');
    progress.style.width = `${(current + 1) / screens.length * 100}%`;
    stepLabel.textContent = `A LITTLE JOURNEY · ${current + 1} / ${screens.length}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    syncScreenMusic();

    if (current === screens.length - 1) {
        hearts(18);
    }
}

document.getElementById('start').addEventListener('click', () => showScreen(1));

document.querySelectorAll('.next').forEach(button => {
    button.addEventListener('click', () => showScreen(Math.min(current + 1, screens.length - 1)));
});

const envelope = document.getElementById('envelope');
envelope.addEventListener('click', () => {
    if (envelope.classList.contains('open')) {
        return;
    }

    envelope.classList.add('open');
    document.getElementById('hint').textContent = 'A little message, from my heart...';
    setTimeout(() => {
        document.getElementById('letterNote').classList.add('show');
    }, 900);
    hearts(8);
});

document.querySelectorAll('.keepsake').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.keepsake').forEach(keepsake => {
            keepsake.classList.remove('opened');
        });

        button.classList.add('opened');
        document.getElementById('message').textContent = button.dataset.message;
        hearts(3);
    });
});

function answer(event) {
    const screen = event.currentTarget.closest('.screen');
    screen.querySelector('.feedback').textContent = event.currentTarget.dataset.feedback;
    screen.querySelector('.next').classList.remove('hidden');
    hearts(12);
}

document.querySelectorAll('.question:not(.gift-guess) .answer').forEach(button => {
    button.addEventListener('click', answer);
});

document.querySelectorAll('.gift-option').forEach(button => {
    button.addEventListener('click', () => {
        const screen = button.closest('.screen');
        const feedback = screen.querySelector('.gift-feedback');
        const isCorrect = button.dataset.correct === 'true';
        const attempts = Number(screen.dataset.giftAttempts || 0) + 1;
        const isFinalAttempt = attempts === 2;

        screen.dataset.giftAttempts = attempts;
        if (isCorrect) {
            screen.dataset.giftWon = 'true';
        }

        button.disabled = true;
        button.classList.add('selected');

        if (isFinalAttempt) {
            screen.querySelectorAll('.gift-option').forEach(option => {
                option.disabled = true;
            });

            feedback.textContent = screen.dataset.giftWon === 'true'
                ? "You guessed it! Our cake is on me, and chocolate is absolutely an option! 🎂❤️"
                : "Not quite! Looks like I have to taste a different flavour today. 😉";
            screen.querySelector('.next').classList.remove('hidden');
        } else if (isCorrect) {
            feedback.textContent = "Yaay!! You guessed it! You still have one last attempt if you want. ❤️";
        } else {
            feedback.textContent = "Not quite! This is your last attempt—take another guess. 😉";
        }

        if (isCorrect) {
            hearts(16);
        } else {
            hearts(6);
        }

        if (isCorrect) {
            playReactionSound(cheerSound, 'cheer');
        } else {
            playReactionSound(fartSound, 'fart');
        }
    });
});

document.getElementById('celebrate').addEventListener('click', () => {
    hearts(45);
    loveMessages(12);
    document.getElementById('wish').textContent =
        "And if I had to do it all over again, I'd still choose you. ❤️";
    document.getElementById('celebrate').innerHTML = 'Forever and always ♥';
});

function loveMessages(n) {
    const layer = document.getElementById('particles');

    for (let i = 0; i < n; i++) {
        const message = document.createElement('span');
        const delay = Math.random() * 3;
        const duration = 5 + Math.random() * 3;

        message.className = 'love-particle';
        message.textContent = 'I love you';
        message.setAttribute('aria-hidden', 'true');
        message.style.left = `${Math.random() * 85 + 5}%`;
        message.style.setProperty('--duration', `${duration}s`);
        message.style.setProperty('--delay', `${delay}s`);
        layer.appendChild(message);
        setTimeout(() => message.remove(), (duration + delay) * 1000);
    }
}

function hearts(n) {
    const layer = document.getElementById('particles');
    const symbols = ['♥', '✦', '♡', '✧'];

    for (let i = 0; i < n; i++) {
        const particle = document.createElement('span');
        particle.className = 'particle';
        particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.fontSize = `${10 + Math.random() * 18}px`;
        particle.style.setProperty('--duration', `${4 + Math.random() * 4}s`);
        layer.appendChild(particle);
        setTimeout(() => particle.remove(), 8500);
    }
}

setTimeout(() => hearts(8), 500);
