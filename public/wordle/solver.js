'use strict';

let words = null;
const MAX_RESULTS = 100;

async function fetchWords() {
  const options = {
    credentials: 'same-origin'
  };

  return await fetch('words.json', options)
    .then(response => response.json());
}

function getLettersOnly(text) {
  return text.replaceAll(/[^a-z]/ig, '');
}

function registerKeyboardNavigation() {
  let lastNotLetterFocus = document.getElementById('not_letter_1');

  document.querySelectorAll('#unwanted').forEach(txt => {
    txt.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
        // ignore event if modfier keys are pressed
        return;
      }

      if (e.key === 'ArrowDown' && lastNotLetterFocus) {
        // move down to last focused 'Wrong spot'
        lastNotLetterFocus.focus();
        e.preventDefault();
      }
    });
  });

  document.querySelectorAll('.not_letter').forEach(txt => {
    txt .addEventListener('focus', e => {
      lastNotLetterFocus = txt;
    });
    txt.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
        // ignore event if modfier keys are pressed
        return;
      }

      if (e.key === 'ArrowUp') {
        // move up to 'Not in the word' field
        document.getElementById('unwanted').focus();
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        // move down to 'Correct spot'
        document.getElementById(txt.id.replace(/^not_/,'')).focus();
        e.preventDefault();
      }
    });
  });

  document.querySelectorAll('.letter').forEach(txt => {
    txt.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
        // ignore event if modfier keys are pressed
        return;
      }

      if (e.key === 'ArrowUp') {
        // move up to 'Wrong spot'
        document.getElementById(`not_${txt.id}`).focus();
        e.preventDefault();
      }
    });
  });

  document.querySelectorAll('.not_letter, .letter').forEach(txt => {
    txt.addEventListener('keydown', e => {

      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
        return;
      }

      if (e.key === 'ArrowLeft' && txt.selectionStart == 0) {
        const prevSibling = txt.previousElementSibling;
        if (prevSibling) {
          prevSibling.focus();
          const caretPos = prevSibling.value.length;
          prevSibling.setSelectionRange(caretPos, caretPos);
          e.preventDefault();
        }
      } else if (e.key === 'ArrowRight' && txt.selectionStart == txt.value.length) {
        const nextSibling = txt.nextElementSibling;
        if (nextSibling) {
          nextSibling.focus();
          nextSibling.setSelectionRange(0, 0);
          e.preventDefault();
        }
      }
    });
  });
}

async function load() {
  words = await fetchWords();

  const today = new Date().getDate().toString();
  const savedDate = window.localStorage.getItem('date');

  // help users reset all textboxes when the page reloads on a new day
  const resetLocalStorage = today !== savedDate;

  document.querySelectorAll('input').forEach(txt => {
    if (resetLocalStorage) {
      window.localStorage.removeItem(txt.id);
    }

    txt.addEventListener('input', async e => {
      const data = getLettersOnly(e.target.value);
      window.localStorage.setItem(e.target.id, data);
      window.localStorage.setItem('date', today);
      e.target.value = data;
      await solve();
    });

    const savedText = window.localStorage.getItem(txt.id);
    if (savedText) {
      txt.value = savedText;
    }

    // only allow letters (does not prevent paste)
    txt.addEventListener('keypress', e => {
      if (!e.key.match(/^[a-zA-Z]$/)) {
        e.preventDefault();
      }
    });
  });

  registerKeyboardNavigation();
  await solve();
}

function hasAny(letters, word) {
  for (let letter of letters) {
    if (word.match(new RegExp(letter, 'i'))) {
      return true;
    }
  }

  return false;
}

function hasAll(letters, word) {
  for (let letter of letters) {
    if (!word.match(new RegExp(letter, 'i'))) {
      return false;
    }
  }

  return true;
}

function filter() {
  const unwanted = getLettersOnly(document.getElementById('unwanted').value);

  const letters = [
    [document.getElementById('not_letter_1').value, document.getElementById('letter_1').value],
    [document.getElementById('not_letter_2').value, document.getElementById('letter_2').value],
    [document.getElementById('not_letter_3').value, document.getElementById('letter_3').value],
    [document.getElementById('not_letter_4').value, document.getElementById('letter_4').value],
    [document.getElementById('not_letter_5').value, document.getElementById('letter_5').value],
  ].map(a => a.map(getLettersOnly))

  // deduce wanted letters from the filters
  const wanted = Array.from(new Set(letters.flat().filter(x => !!x).join('')));

  const pattern = new RegExp(letters.flatMap(l => {
    if (l[1]) {
      return l[1];
    } else if (l[0]) {
      return `[^${l[0]}]`;
    }
    return '.';
  }).join(''), 'i');

  return Object.keys(words).filter(word => hasAll(wanted, word)
    && !hasAny(unwanted, word)
    && word.match(pattern)
  ).map(w => [w, words[w]]);
}

function createResult(text) {
  const result = document.createElement('li');
  result.textContent = text[0];
  result.title = Math.log10(text[1]) * 10;
  return result;
}

function comp_freq(a, b) {
  if (a[1] < b[1]) {
    return 1;
  }
  if (b[1] < a[1]) {
    return -1;
  }

  return 0;
}

function comp_word(a, b) {
  if (a[0] < b[0]) {
    return -1;
  }
  if (b[0] < a[0]) {
    return 1;
  }

  return 0;
}

function sample(array, n) {
  if (array.length > n) {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n).sort(comp_freq);
  }

  return array.sort(comp_freq);
}

function getResultText(nbMatches) {
  let text;
  let icon;
  let punct = '.';

  if (nbMatches == 0) {
    icon = '❌';
    text = 'No matches';
  } else if (nbMatches == 1) {
    icon = '🎉';
    text = 'Nice';
    punct = '!';
  } else if (nbMatches > 1) {
    text = `Found ${nbMatches} matches`;
    if (nbMatches > MAX_RESULTS) {
      text += `. Showing ${MAX_RESULTS} random results`;
      icon = '💡'
    } else {
      icon = '✅'
    }
  }

  return `${icon} ${text}${punct}`;
}

async function solve() {
  const resultHeader = document.getElementById('result_header');
  const list = document.getElementById('results');
  const allResults = filter();
  resultHeader.textContent = getResultText(allResults.length);
  const results = sample(allResults, MAX_RESULTS);
  list.replaceChildren(...results.map(r => createResult(r)));
}

window.addEventListener('load', load);
