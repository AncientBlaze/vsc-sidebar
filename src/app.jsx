import { useState } from 'preact/hooks';

export const App = () => {
  // State for input modal
  const [inputModal, setInputModal] = useState({
    visible: false,
    type: null, // 'file' or 'folder'
    parentItem: null,
    inputValue: ''
  });
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null
  });
  const [fileStructure, setFileStructure] = useState([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      isOpen: true,
      children: [
        { id: '1-1', name: 'components', type: 'folder', isOpen: false, children: [] },
        { id: '1-2', name: 'assets', type: 'folder', isOpen: false, children: [] },
        { id: '1-3', name: 'app.jsx', type: 'file', extension: 'jsx' },
        { id: '1-4', name: 'main.jsx', type: 'file', extension: 'jsx' },
        { id: '1-5', name: 'index.css', type: 'file', extension: 'css' },
      ]
    },
    {
      id: '2',
      name: 'public',
      type: 'folder',
      isOpen: false,
      children: [
        { id: '2-1', name: 'favicon.ico', type: 'file', extension: 'ico' },
        { id: '2-2', name: 'index.html', type: 'file', extension: 'html' },
      ]
    },
    { id: '3', name: 'package.json', type: 'file', extension: 'json' },
    { id: '4', name: 'vite.config.js', type: 'file', extension: 'js' },
    { id: '5', name: 'README.md', type: 'file', extension: 'md' },
  ]);

  const toggleFolder = (folderId) => {
    const updateFolderState = (items) => {
      return items.map(item => {
        if (item.id === folderId && item.type === 'folder') {
          return { ...item, isOpen: !item.isOpen };
        } else if (item.children) {
          return { ...item, children: updateFolderState(item.children) };
        }
        return item;
      });
    };

    setFileStructure(updateFolderState(fileStructure));
  };

  // Function to render file/folder icons
  const getIcon = (item) => {
    if (item.type === 'folder') {
      return item.isOpen ? '📂' : '📁';
    } else {
      switch (item.extension) {
        case 'js':
        case 'jsx':
          return '📄';
        case 'css':
          return '🎨';
        case 'html':
          return '🌐';
        case 'json':
          return '📋';
        case 'md':
          return '📝';
        default:
          return '📄';
      }
    }
  };


  const handleItemClick = (item, event) => {
    event.stopPropagation();
    setSelectedItemId(item.id);
    if (item.type === 'folder') {
      toggleFolder(item.id);
    }
  };


  const [hoveredItemId, setHoveredItemId] = useState(null);


  const renderTree = (items, level = 0) => {
    return items.map((item) => (
      <div key={item.id}>
        <div 
          className={`flex items-center justify-between cursor-pointer py-1 px-2 ${
            level > 0 ? 'ml-' + (level * 4) : ''
          } ${
            selectedItemId === item.id ? 'bg-blue-800' : 'hover:bg-gray-700'
          }`}
          onClick={(e) => handleItemClick(item, e)}
          onContextMenu={(e) => handleContextMenu(e, item)}
          onMouseEnter={() => setHoveredItemId(item.id)}
          onMouseLeave={() => setHoveredItemId(null)}
        >
          <div className="flex items-center">
            <span className="mr-2">{getIcon(item)}</span>
            <span className="text-sm text-gray-200">{item.name}</span>
          </div>

          {/* Hover actions */}
          {hoveredItemId === item.id && (
            <div className="flex space-x-2">
              {item.type === 'folder' && (
                <button 
                  className="text-xs text-gray-400 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInputModal({
                      visible: true,
                      type: 'file',
                      parentItem: item,
                      inputValue: ''
                    });
                  }}
                >
                  +
                </button>
              )}
              <button 
                className="text-xs text-gray-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  // This would show more options in a real implementation
                  alert(`More options for ${item.name}`);
                }}
              >
                ⋯
              </button>
            </div>
          )}
        </div>
        {item.type === 'folder' && item.isOpen && item.children && item.children.length > 0 && 
          renderTree(item.children, level + 1)
        }
      </div>
    ));
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item
    });
  };

  const handleClickOutside = () => {
    setContextMenu({
      ...contextMenu,
      visible: false
    });

    // Also close the input modal if it's open
    if (inputModal.visible) {
      setInputModal({
        ...inputModal,
        visible: false
      });
    }
  };

  // Generate a unique ID for new items
  const generateUniqueId = (parentId) => {
    // Get current timestamp for uniqueness
    const timestamp = new Date().getTime();
    return parentId ? `${parentId}-${timestamp}` : `${timestamp}`;
  };

  // Add a new file or folder to the file structure
  const addNewItem = (parentId, name, type, extension = '') => {
    // Create the new item
    const newItem = {
      id: generateUniqueId(parentId),
      name,
      type,
      ...(type === 'folder' ? { isOpen: false, children: [] } : { extension })
    };

    // Function to recursively update the file structure
    const updateFileStructure = (items) => {
      return items.map(item => {
        if (item.id === parentId) {
          // Add the new item to this folder's children
          return {
            ...item,
            isOpen: true, // Open the folder to show the new item
            children: [...item.children, newItem]
          };
        } else if (item.children) {
          // Recursively search in children
          return {
            ...item,
            children: updateFileStructure(item.children)
          };
        }
        return item;
      });
    };

    // Update the file structure state
    setFileStructure(updateFileStructure(fileStructure));
  };

  // Handle input modal submission
  const handleInputSubmit = () => {
    const { type, parentItem, inputValue } = inputModal;

    if (inputValue.trim() === '') {
      alert('Name cannot be empty');
      return;
    }

    // Determine file extension if it's a file
    let name = inputValue.trim();
    let extension = '';

    if (type === 'file' && name.includes('.')) {
      const parts = name.split('.');
      extension = parts.pop();
      name = parts.join('.');
    } else if (type === 'file') {
      // Default extension for files without one
      extension = 'txt';
      name = `${name}.${extension}`;
    }

    // Add the new item to the file structure
    addNewItem(parentItem.id, name, type, extension);

    // Close the modal
    setInputModal({
      visible: false,
      type: null,
      parentItem: null,
      inputValue: ''
    });
  };

  // Context menu actions
  const contextMenuActions = [
    {
      label: 'New File',
      action: (item) => {
        setInputModal({
          visible: true,
          type: 'file',
          parentItem: item,
          inputValue: ''
        });
        setContextMenu({ ...contextMenu, visible: false });
      },
      showFor: (item) => item.type === 'folder'
    },
    {
      label: 'New Folder',
      action: (item) => {
        setInputModal({
          visible: true,
          type: 'folder',
          parentItem: item,
          inputValue: ''
        });
        setContextMenu({ ...contextMenu, visible: false });
      },
      showFor: (item) => item.type === 'folder'
    },
    {
      label: 'Rename',
      action: (item) => {
        alert(`Rename ${item.name}`);
        setContextMenu({ ...contextMenu, visible: false });
      },
      showFor: () => true
    },
    {
      label: 'Delete',
      action: (item) => {
        alert(`Delete ${item.name}`);
        setContextMenu({ ...contextMenu, visible: false });
      },
      showFor: () => true
    }
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-white" onClick={handleClickOutside}>
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-3 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase">Explorer</h2>
          <button className="text-gray-400 hover:text-white">⋮</button>
        </div>
        <div className="overflow-y-auto flex-grow">
          {renderTree(fileStructure)}
        </div>
      </div>
      <div className="flex-grow p-4">
        <h1 className="text-4xl font-bold mb-4">VSCode-like Sidebar</h1>
      </div>

      {contextMenu.visible && contextMenu.item && (
        <div 
          className="absolute bg-gray-800 border border-gray-700 shadow-lg rounded py-1 z-10"
          style={{ 
            left: `${contextMenu.x}px`, 
            top: `${contextMenu.y}px` 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenuActions
            .filter(action => action.showFor(contextMenu.item))
            .map((action, index) => (
              <div 
                key={index}
                className="px-4 py-1 hover:bg-gray-700 cursor-pointer text-sm text-gray-200"
                onClick={() => action.action(contextMenu.item)}
              >
                {action.label}
              </div>
            ))
          }
        </div>
      )}

      {/* Input Modal for creating new files/folders */}
      {inputModal.visible && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
          onClick={() => setInputModal({ ...inputModal, visible: false })}
        >
          <div 
            className="bg-gray-800 p-4 rounded-md shadow-lg w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">
              {inputModal.type === 'file' ? 'Create New File' : 'Create New Folder'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">
                {inputModal.type === 'file' ? 'File Name' : 'Folder Name'}
              </label>
              <input
                type="text"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                value={inputModal.inputValue}
                onChange={(e) => setInputModal({ ...inputModal, inputValue: e.target.value })}
                placeholder={inputModal.type === 'file' ? 'Enter file name' : 'Enter folder name'}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleInputSubmit();
                  } else if (e.key === 'Escape') {
                    setInputModal({ ...inputModal, visible: false });
                  }
                }}
              />
              {inputModal.type === 'file' && (
                <p className="text-xs text-gray-400 mt-1">
                  You can include an extension (e.g., .js, .txt) or leave it blank for default (.txt)
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                onClick={() => setInputModal({ ...inputModal, visible: false })}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                onClick={handleInputSubmit}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
