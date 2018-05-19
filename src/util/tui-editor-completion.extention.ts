/**
 * @license MIT
 */

const esrever = require('esrever');

function getCurrentWord(editor: any, prefix?: string): string {
    if (!prefix) {
        return '';
    }
    const currentPosition = editor.getRange();
    const line = currentPosition.start.line;

    const text = editor
        .mdEditor
        .getTextObject({
            start: { line, ch: 0 },
            end: { line, ch: Number.MAX_SAFE_INTEGER }
        })
        .getTextContent();

    return getWordAt(text, currentPosition.start.ch);
}

function getWordAt(str: string, pos: number) {

    const left = str.slice(0, pos + 1).search(/\S+$/),
        right = str.slice(pos).search(/\s/);

    // The last word in the string is a special case.
    if (right < 0) {
        return str.slice(left);
    }

    // Return the word, using the located bounds to extract it from the string.
    return str.slice(left, right + pos);

}

(function (factory) {
    factory(require('tui-editor'));
})(function (Editor: any) {
    // define youtube extension
    Editor.defineExtension('mention', function (this: any) {
        setImmediate(function () {
            const editor = Editor.getInstances().pop();

            if (!editor) {
                throw new Error('Failed to fetch Editor');
            }

            if (!editor.options.mention) {
                return;
            }

            editor.mdEditor.eventManager.listen('keyup', (_event: { data: KeyboardEvent }) => {
                for (const settings of editor.options.mention) {
                    const word = getCurrentWord(editor, settings.prefix);

                    if (word.startsWith(settings.prefix)) {
                        // tslint:disable-next-line:no-console
                        console.log({
                            prefix: settings.prefix,
                            word,
                        });
                    }
                }
            });

        });
    });
});
