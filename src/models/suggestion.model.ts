/**
 * @license MIT
 */

export class Suggestion {
    public image?: string;
    public displayText!: string;
    public text!: string;
    public type!: 'image' | 'identity' | 'blob' | 'emoji';

    public constructor(suggestion: Partial<Suggestion>) {
        Object.assign(this, suggestion);
    }

    public render(element: HTMLLIElement, _self: any, data: Suggestion) {

        const container = document.createElement('div');
        container.className = 'ui grid';
        container.innerHTML = `<div class="two wide column"><img class="ui fluid image" src="${data.image}"></div>
<div class="fourteen wide column">${data.displayText}</div>`;

        return element.appendChild(container);
    }
}
