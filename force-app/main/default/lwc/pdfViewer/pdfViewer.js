import { LightningElement, track } from 'lwc';
import onuploadFile from '@salesforce/apex/FileController.uploadFile';
import {NavigationMixin} from 'lightning/navigation'
export default class PdfViewer extends NavigationMixin(LightningElement) {
  @track fileUrl;
    selectedFile;
    filesList =[];
    handleFileChange(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = () => {
                this.selectedFile = {
                    base64: reader.result,
                    fileName: file.name
                };
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a PDF file only.');
        }
    }

    handleUpload() {
        if (this.selectedFile) {
          console.log('base64: ' + this.selectedFile.base64);
          console.log('fileName: ' + this.selectedFile.fileName);
            onuploadFile({ 
                base64Data: this.selectedFile.base64,
                fileName: this.selectedFile.fileName,
                recordId: null // or a record Id to attach file
            })
            .then(data  => {
               this.filesList = Object.keys(data).map(item=>({"label":data[item],
             "value": item,
             "url":`/sfc/servlet.shepherd/document/download/${item}`
            }))
            console.log(this.filesList)
            })
            .catch(error => {
                console.error(error);
                alert('Error uploading file.');
            });
        } else {
            alert('No file selected.');
        }
    }
    previewHandler(event){
        console.log(event.target.dataset.id)
        this[NavigationMixin.Navigate]({ 
            type:'standard__namedPage',
            attributes:{ 
                pageName:'filePreview'
            },
            state:{ 
                selectedRecordId: event.target.dataset.id
            }
        })
    }
}