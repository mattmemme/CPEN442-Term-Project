// Taking care of the browser-specific prefixes.
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.directoryEntry = window.directoryEntry || window.webkitDirectoryEntry;

// …

function onFs(fs){
  fs.root.getDirectory('Documents', {create:true}, (directoryEntry) => {
    //directoryEntry.isFile === false
    //directoryEntry.isDirectory === true
    //directoryEntry.name === 'Documents'
    //directoryEntry.fullPath === '/Documents'
    console.log('we found ')

    }, onError);


  }

// Opening a file system with temporary storage
window.requestFileSystem(TEMPORARY, 1024*1024 /*1MB*/, onFs, onError);