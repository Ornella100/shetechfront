import { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../lib/api';

// Éditeur riche (pattern GeekCoding4Kids) : produit du HTML, affiché tel quel
// par miniMdToHtml + .fd-prose côté apprenante.
// Le bouton image uploade le fichier vers le backend et insère l'URL
// (pas de base64 stocké en base).
export default function RichTextEditor({ value, onChange, placeholder }) {
  const quillRef = useRef(null);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        ['link', 'image', 'code-block'],
        ['clean'],
      ],
      handlers: {
        image: function () {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/jpeg,image/png,image/webp,image/gif';
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('image', file);
            try {
              const res = await api.post('/upload/image', formData);
              const editor = quillRef.current?.getEditor();
              if (!editor) return;
              const range = editor.getSelection(true);
              const index = range ? range.index : editor.getLength();
              editor.insertEmbed(index, 'image', res.data.url);
              editor.setSelection(index + 1);
            } catch (err) {
              alert(err.response?.data?.message || "Échec de l'upload de l'image");
            }
          };
          input.click();
        },
      },
    },
  }), []);

  return (
    <div className="st-rte" style={{ marginBottom: 16 }}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder || 'Rédigez le contenu de la leçon…'}
      />
      <style>{`
        .st-rte .ql-toolbar {
          background: #faf5f7;
          border: 1px solid #eadfe4 !important;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .st-rte .ql-container {
          border: 1px solid #eadfe4 !important;
          border-top: none !important;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          min-height: 180px;
          font-family: inherit;
          font-size: 14px;
          background: #fff;
        }
        .st-rte .ql-editor {
          min-height: 180px;
        }
        .st-rte .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .st-rte .ql-toolbar .ql-active .ql-stroke,
        .st-rte .ql-toolbar button:hover .ql-stroke {
          stroke: #C45C7A;
        }
        .st-rte .ql-toolbar .ql-active .ql-fill,
        .st-rte .ql-toolbar button:hover .ql-fill {
          fill: #C45C7A;
        }
        .st-rte .ql-editor img {
          max-width: 100%;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
