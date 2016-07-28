/*
  Функция getWordFromEvent(e) создает range по клику и возвращает слово по координатам клика
  Три варианта, для Chrome + Safari, для IE и для Mozilla

  При клике мы ловим ноду, в которую был клик, получаем смещение слева от края ноды и в случае с FF и Chrome,
  проверям символы слева и справа от этой точки на наличие разделителей, чтобы найти конец слова, IE умеет делать это сам.
*/


export function getWordFromEvent(e) {
  // для Chrome, Safari
  if (global.document.caretRangeFromPoint) {
    return getRangeChrome(e);
  }
  //IE
  if (global.document.body.createTextRange) {
    return getWordFromEventIE(e);
  }
  //FF
  if (global.document.createRange) {
    return getRangeFF(e);
  }
  return null;
}

function getRangeChrome(e) {
  const x = e.clientX;
  const y = e.clientY;
  const range = global.document.caretRangeFromPoint(x, y);
  return getWordFromRange(range, e);
}

function getWordFromEventIE(e) {
  const x = e.clientX;
  const y = e.clientY;
  const innerText = e.target && e.target.innerText;
  const separators = /([\s&^:;,!?(){}])+/;
  const IErange = global.document.body.createTextRange();

  try {
    IErange.moveToElementText(e.target);
    IErange.collapse(true);

    let wholeSentenceLength = 0;
    const reqIEcharTest = () => {
      do {
        IErange.expand("character");
        wholeSentenceLength += 1;
      }
      while (!separators.test(IErange.text.slice(-1)) && wholeSentenceLength <= innerText.length);
      const {boundingLeft, boundingTop, boundingWidth, boundingHeight, text} = IErange;

      if (boundingLeft <= x && x <= (boundingLeft + boundingWidth)
       && boundingTop <= y && y <= (boundingTop + boundingHeight)) {
        if (wholeSentenceLength <= innerText.length && !separators.test(text.slice(-1)) ) {
          return text;
        }
        return text.substr(0, text.length - 1);
      }
      IErange.collapse(false);
      return reqIEcharTest();
    };
    const text = reqIEcharTest().trim();
    const innerTextArr = innerText.split(text);
    const innerTextLeft = innerTextArr[0].split(separators);
    const innerTextRight = innerTextArr[1].split(separators);

    let leftPart;
    if (innerTextLeft <= 1) {
      leftPart = recursionWordGet(e.target, 'left') + innerTextLeft.slice(-1)[0];
    } else {
      leftPart = innerTextLeft.slice(-1)[0];
    }
    let rightPart;
    if (innerTextRight <= 1) {
      rightPart = innerTextRight[0] + recursionWordGet(e.target, 'right');
    } else {
      rightPart = innerTextRight[0];
    }

    return leftPart + text + rightPart;
  } catch (err) {
    console.log('>>>>>>>>>>>>>>>>>> text', err);
  }
}

function getRangeFF(e) {
  const x = e.clientX;
  const y = e.clientY;
  const range = global.document.caretPositionFromPoint(x, y);
  return getWordFromRange(range, e);
}

function getWordFromRange(range, e) {
  const text = e && e.target && (e.target.innerText || e.target.textContent) || '';
  const wordClickPoint = range && range.startOffset || range && range.offset; //ff
  const separators = /([\s&^:;,!?(){}])+/;

  const textLeft = text.substr(0, wordClickPoint || 0);
  const textRight = text.substr(wordClickPoint || 0);

  const textLeftSplit = textLeft.split(separators);
  const textRightSplit = textRight.split(separators);

  let rightPart;
  if (textRightSplit.length <= 1) {
    rightPart = textRightSplit[0] + recursionWordGet(e.target, 'right');
  } else {
    rightPart = textRightSplit[0];
  }
  let leftPart;
  if (textLeftSplit.length <= 1) {
    leftPart = recursionWordGet(e.target, 'left') + textLeftSplit.slice(-1)[0];
  } else {
    leftPart = textLeftSplit.slice(-1)[0];
  }
  return (leftPart + rightPart).trim();
}

function recursionWordGet(target, option) {
  const separators = /([\s&^:;,!?(){}])+/;
  const uniqString = Date.now();

  target.setAttribute("data-target", uniqString);
  const {parentNode} = target;
  const copyNode = parentNode.cloneNode(true);
  // const targetNodeText = target.innerText;

  //поменяем текст в скопированной ноде, чтобы потом найти его парсингом
  const dataTargetNode = copyNode.querySelector(`[data-target="${uniqString}"]`);
  if (dataTargetNode.hasOwnProperty('innerText')) {
    dataTargetNode.innerText = uniqString;
  } else {
    dataTargetNode.textContent = uniqString;
  }
  const tagName = copyNode.tagName;

  //возьмем весь текст
  const text = copyNode.innerText || copyNode.textContent;
  const textArr = text.split(uniqString);
  const textLeftPartArr = textArr[0].split(separators);
  const textRightPartArr = textArr[1].split(separators);

  if (option === 'right') {
    let returnText;
    if (textRightPartArr.length <= 1 && tagName === 'span') {
      //разделителей нет, нужно подниматься на уровень выше
      returnText = textRightPartArr[0] + recursionWordGet(parentNode, 'right');
    } else {
      returnText = textRightPartArr[0];
    }
    return returnText;
  }

  if (option === 'left') {
    let returnText;
    if (textLeftPartArr <= 1 && tagName === 'span') {
      //разделителей нет, нужно подниматься на уровень выше
      returnText = recursionWordGet(parentNode, 'left') + textLeftPartArr.slice(-1)[0];
    } else {
      returnText = textLeftPartArr.slice(-1)[0];
    }
    return returnText;
  }

  return '';
}
