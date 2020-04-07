import {FileUploader} from "baseui/file-uploader";
import React, {useCallback} from "react";
import firebase from "firebase/app";
import "firebase/storage";


export default (props: {
    storageRef?: firebase.storage.Reference,
    onUploaded?: (file: File, url: string) => void
}) => {
    const [errorMessage, setErrorMessage] = React.useState("");
    const [progress, setProgress] = React.useState<number>();
    const [uploadTask, setUploadTask] = React.useState<firebase.storage.UploadTask>();

    const upload = useCallback((acceptedFiles: File[], rejectedFiles: File[]) => {
        if (props.storageRef) {
            acceptedFiles.forEach(
                (acceptedFile: File) => {
                    setErrorMessage("");
                    if (acceptedFile.type === "audio/x-wav") {
                        const uploadTask = props.storageRef.child(acceptedFile.name).put(acceptedFile);
                        uploadTask.on('state_changed', (snapshot) => {
                            setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                        }, (error) => setErrorMessage(error.message), () => {
                            setProgress(0);
                            if (props.onUploaded)
                                uploadTask.snapshot.ref.getDownloadURL().then(
                                    (url: string) => props.onUploaded(acceptedFile, url)
                                );
                        });
                        setUploadTask(uploadTask);
                    } else {
                        setErrorMessage("Please use only .wav Files");
                    }
                }
            )
        }
    }, [props.storageRef]);

    return <FileUploader
        disabled={!props.storageRef}
        onCancel={() => {
            if (uploadTask) {
                uploadTask.cancel();
                setProgress(0);
            }
        }}
        onDrop={upload}
        // progressAmount is a number from 0 - 100 which indicates the percent of file transfer completed
        progressAmount={progress}
        progressMessage={
            progress
                ? `Uploading... ${progress}% of 100%`
                : ''
        }
        errorMessage={errorMessage}/>;
}
