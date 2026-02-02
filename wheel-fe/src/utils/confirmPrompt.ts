import { h, ref } from 'vue';
import { Modal, message, Input } from 'ant-design-vue';

export interface ConfirmOptions {
	title?: string;
	content?: string;
	expected?: string; // exact text user must type to confirm
	okText?: string;
	cancelText?: string;
}

export function confirmWithInput(opts: ConfirmOptions): Promise<boolean> {
	const { title = 'Please confirm', content = '', expected, okText = 'Confirm', cancelText = 'Cancel' } = opts;
	const input = ref('');

	return new Promise((resolve) => {
		let modal: any = null;

		modal = Modal.confirm({
			title,
			icon: null,
			content: h('div', { style: 'display:flex;flex-direction:column;gap:8px' }, [
				content ? h('div', { style: 'white-space:pre-wrap' }, content) : null,
				h(Input, {
					value: input.value,
					onInput: (e: Event) => {
						// @ts-ignore - Event typing
						input.value = (e.target as HTMLInputElement).value;
						// Update modal OK button disabled state
						try {
							modal?.update?.({ okButtonProps: { disabled: !!expected && input.value !== expected } });
						} catch (_e) { }
					},
					placeholder: expected ? `Type ${expected} to confirm` : '',
					style: 'width:100%',
					autofocus: true,
				}),
			]),
			okText,
			cancelText,
			maskClosable: false,
			// Initially disable OK if expected is provided
			okButtonProps: { disabled: !!expected },
			onOk: () => {
				if (expected && input.value !== expected) {
					message.error(`Please type "${expected}" to confirm.`);
					// returning a rejected promise tells Modal to keep open
					return Promise.reject();
				}
				modal.destroy();
				resolve(true);
				return Promise.resolve();
			},
			onCancel: () => {
				modal.destroy();
				resolve(false);
			},
		});
	});
}
