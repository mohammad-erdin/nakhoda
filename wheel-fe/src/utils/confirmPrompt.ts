import { h, ref } from 'vue';
import { Modal, message } from 'ant-design-vue';

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
    const modal = Modal.confirm({
      title,
      icon: null,
      content: h('div', { style: 'display:flex;flex-direction:column;gap:8px' }, [
        content ? h('div', { style: 'white-space:pre-wrap' }, content) : null,
        h('input', {
          value: input.value,
          onInput: (e: Event) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - Event typing
            input.value = (e.target as HTMLInputElement).value;
          },
          placeholder: expected ? `Type ${expected} to confirm` : '',
          style: 'width:100%;padding:8px;border:1px solid #d9d9d9;border-radius:4px',
        }),
      ]),
      okText,
      cancelText,
      maskClosable: false,
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
