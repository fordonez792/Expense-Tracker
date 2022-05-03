import { addToLocalStorage, getLocalStorage, editLocalStorage, removeFromLocalStorage, log, qs, qsa, createElement, formatCurrency, sanitizeInput, getMonth, sleep }  from "./utils.js"

// Query selectors for table and input section
const name=qs('#name')
const amount=qs('#amount')
const date=qs('#date')
const addExpenseBtn=qs('#add-expense-btn')
const tableContainer=qs('.output-table')
const options=qs('.options')
const allBTN=qsa('.add-expense-btn')
// Query selectors for account information section
const accountSavings=qs('#account-savings')
const income=qs('#income')
const saveBTN=qs('#save-btn')
const inputContainer=qs('#input')
const savingsContainer=qs('#savings')
const accountInfo=qs('.info')
const editBTN=qs('.edit')
const paragraphs=qsa('.description')
//Query Selector Modal
const openModalButton=qsa('[data-modal-target]')
const closeModalButton=qsa('[data-close-btn]')
const overlay=qs('#overlay')
const body=qs('body')
const historyTable=qs('.display-table')
// Query Selector Alert
const negativeAlert=qs('.alert')
const positiveAlert=qs('.positive-alert')
const closePositiveAlert=qs('.close-positive-alert')
const positiveAlertMessage=qs('.positive-msg')
const closeAlert=qs('.close-alert')
const alertMessage=qs('.msg')

// Creates table but hides it as there is no data still
const table=createElement('table', {class: 'hidden'})
tableContainer.appendChild(table)
table.innerHTML=`<tr data-id="-1">
                    <th>Name</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th></th>
                </tr>`

                // Returns length of each piece of the description
// also duration of animation to have same typing speed throughout
let previousDelay=0
let previousDuration=0
paragraphs.forEach(paragraph => {
    const paragraphLength=parseInt(paragraph.textContent.length)
    paragraph.style.setProperty('--length', paragraphLength)
    let duration=paragraphLength/10
    let delay=previousDuration+previousDelay+1
    paragraph.style.setProperty('--delay', delay+'s')
    if(duration>=1){
        paragraph.style.setProperty('--duration', duration+'s')
    }
    if(paragraph.dataset.id==="1"){
        paragraph.style.setProperty('--delay', 1+'s')
    }
    previousDelay=delay
    previousDuration=duration
})
// Retrieve all information inside LocalStorage API
window.addEventListener('DOMContentLoaded', () => {
    let items=getLocalStorage('list')
    let savings=getLocalStorage('savings')
    let income=getLocalStorage('income')
    let expenses=getLocalStorage('expenses')
    let history=getLocalStorage('history')
    // Prevents bug when saving history and then refreshing immediately
    const temp=localStorage.getItem('income')
    if(income.length===0 || !temp){
        inputContainer.classList.add('hidden')
        savingsContainer.classList.remove('hidden')
        savings.forEach(item => {
            accountSavings.value=item.values
            accountSavings.readOnly=true
        })
        return
    }
    if(savings.length<1 && income.length<1) return
    inputContainer.classList.remove('hidden')
    savingsContainer.classList.add('hidden')

    savings.forEach(item => {
        setUpAccountInfo(item.id, item.values, 'savings')
    })

    income.forEach(item => {
        setUpAccountInfo(item.id, item.values, 'income')
    })

    if(expenses.length<1){
        setUpAccountInfo(3, 0, 'expenses')
    }
    expenses.forEach(item => {
        setUpAccountInfo(item.id, item.values, 'expenses')
    })

    if(items.length>0){
        table.classList.remove('hidden')
        items.forEach(item => {
            setUpRow(item.id, item.values)
        })
    }

    if(history.length>0){
        savings.forEach(item => {
            accountSavings.value=item.values
            accountSavings.readOnly=true
        })
        history.forEach(item => {
            setUpModalRow(item.id, item.values)
        })
    }

    if(income.length>=1){
        setInterval(uploadInfo, 1000)
    }
})
// Mainly calls functions to set up the account info section and to add all values into local storage if they dont exist already
saveBTN.addEventListener('click', () => {
    let accountSavingsValue=accountSavings.value
    let incomeValue=income.value
    if(!incomeValue){
        myAlert("Income can't be 0!", negativeAlert)
        return
    }
    // Prevent XSS attack through input
    accountSavingsValue=sanitizeInput(accountSavingsValue)
    incomeValue=sanitizeInput(incomeValue)

    inputContainer.classList.remove('hidden')
    savingsContainer.classList.add('hidden')
    income.value=''
    accountSavings.value=''

    setUpAccountInfo(1, accountSavingsValue, 'savings')
    const savingsLS=getLocalStorage('savings')
    if(savingsLS.length===0){
        addToLocalStorage(1, accountSavingsValue, 'savings')
    }

    setUpAccountInfo(2, incomeValue, 'income')
    const incomeLS=getLocalStorage('income')
    if(incomeLS.length===0){
        addToLocalStorage(2, incomeValue, 'income')
    }

    setUpAccountInfo(3, 0, 'expenses')
    const expensesLS=getLocalStorage('expenses')
    if(expensesLS.length===0){
        addToLocalStorage(3, 0, 'expenses')
    }
    window.location.reload()
})
// Dynamically creates the account info section by and edits local storage if page is refreshed
const setUpAccountInfo = (id, value, command) => {
    const DIV=createElement('div', {dataset: {id: id}})
    const formattedValue=formatCurrency(value)
    DIV.innerHTML=`<div class='all'>
                        <h3><span class='bold'>${command} </span><span class='span'>${formattedValue}</span></h3>
                    </div>`
    accountInfo.appendChild(DIV)
    const all=qs('.all', DIV)
    const display=qs('.span', DIV)

    if(command==='savings'){
        window.savingsDisplay=display
        window.div1=DIV
        all.classList.add('first')
        display.classList.add('blue')
        editLocalStorage(id, value, command)
    }
    if(command==='income'){
        window.div2=DIV
        all.classList.add('second')
        display.classList.add('green')
        editLocalStorage(id, value, command)
    }
    if(command==='expenses'){
        window.div3=DIV
        window.expensesDisplay=display
        all.classList.add('third')
        display.classList.add('red')
        editLocalStorage(id, value, command)
    }

    editBTN.addEventListener('click', () => {
        inputContainer.classList.add('hidden')
        savingsContainer.classList.remove('hidden')
        accountInfo.removeChild(DIV)
        localStorage.clear()
        table.classList.add('hidden')
        window.location.reload()
    })
}
// Reveals dropdown menu
document.addEventListener('click', e => {
    const isDropDownBtn=e.target.matches('[data-dropdown-btn]')
    if(!isDropDownBtn && e.target.closest('[data-dropdown]')) return
    let currentDropdown
    if(isDropDownBtn){
        currentDropdown=e.target.closest('[data-dropdown]')
        currentDropdown.classList.toggle('active')
    }
    document.querySelectorAll('[data-dropdown].active').forEach(dropdown => {
        if(dropdown===currentDropdown)return
        dropdown.classList.remove('active')
    })
})
options.addEventListener('click', e => {
    name.value=e.target.textContent
    window.dataID=e.target.dataset.id
    name.readOnly=true
})
// Restricts input to only the ones inside the dropdown menu
document.addEventListener('mouseup', e => {
    const clicked=e.target
    if(clicked===name){
        name.readOnly=true
        return
    }
    name.readOnly=false
})
// Modal open/close functionality
openModalButton.forEach(button => {
    button.addEventListener('click', () => {
        const modal=qs(button.dataset.modalTarget)
        if(!modal) return
        if(historyTable.childNodes.length<3){
            myAlert('No history found!', negativeAlert)
            return
        }
        modal.classList.add('on')
        overlay.classList.add('on')
        body.classList.add('disable-scroll')
    })
})
closeModalButton.forEach(button => {
    button.addEventListener('click', () => {
        const modal=button.closest('.modal')
        if(modal==null) return
        modal.classList.remove('on')
        overlay.classList.remove('on')
        body.classList.remove('disable-scroll')
    })
})
overlay.addEventListener('click', () => {
    const modals=qsa('.modal.on')
    modals.forEach(modal => {
        modal.classList.remove('on')
        overlay.classList.remove('on')
        body.classList.remove('disable-scroll')
    })
})
// Creates a row in the modal
const setUpModalRow = (id, values) => {
    const row=createElement('tr', {dataset: {id: id}})
    const formattedSpent=formatCurrency(values[2])
    const formattedSaved=formatCurrency(values[1])
    row.innerHTML=`<td>${values[0]}</td>
                    <td id='money-saved'>${formattedSaved}</td>
                    <td colspan="2" class='money-spent'>${formattedSpent}</td>`
    historyTable.appendChild(row)
    if(values[1]<0){
        row.style.backgroundColor='rgba(255,65,54,0.3)'
    }
    if(values[1]>0){
        row.style.backgroundColor='rgba(50,205,50,0.3)'
    }
}
// Sets up creation of row on click of button
addExpenseBtn.addEventListener('click', () => {
    let nameValue=name.value
    let amountValue=amount.value
    let dateValue=date.value
    const values=[nameValue, amountValue, dateValue]
    // Prevent XSS attack through input
    nameValue=sanitizeInput(nameValue)
    amountValue=sanitizeInput(amountValue)
    dateValue=sanitizeInput(dateValue)
    // Restrict inputs 
    const dateInputValues=new Date(dateValue)
    const currentDay=new Date().getDate()
    const currentMonth=new Date().getMonth()
    const currentYear=new Date().getFullYear()
    const inputDay=dateInputValues.getDate()
    const inputMonth=dateInputValues.getMonth()
    const inputYear=dateInputValues.getFullYear()
    if(!nameValue || !amountValue || !dateValue){
        myAlert('Missing Information!', negativeAlert)
        return
    }
    if(currentDay<inputDay && currentMonth<inputMonth && currentYear<inputYear){
        myAlert("Date can't be past today!", negativeAlert)
        return
    }
    if(currentMonth<inputMonth){
        myAlert('Only current month allowed!', negativeAlert)
        return
    }
    if(amountValue==='0'){
        myAlert("Amount can't be 0!", negativeAlert)
        return
    }
    //retrieve expenses from local storage and update it
    table.classList.remove('hidden')
    let sumLS=getLocalStorage('expenses')
    sumLS.forEach(item => {
        let sum=item.values
        sum+=parseInt(amountValue)
        const formattedSum=formatCurrency(sum)
        window.expensesDisplay.textContent=formattedSum
        editLocalStorage(3, sum, 'expenses')
    })
    myAlert('Expense Added Succesfully!', positiveAlert)
    //Checks if the value inputed already exists
    let valuesLS=getLocalStorage('list')
    valuesLS=valuesLS.filter(item => {
        if(item.id===window.dataID) return item
    })
    // If this item already exists from previous input
    // It will update amount
    // Update date only if its greater than the previous date
    if(valuesLS.length>0){
        valuesLS.forEach(item => {
            const updatedDate=date.value
            let updateSum=parseInt(item.values[1])+parseInt(amountValue)
            let updatedValues=[nameValue, updateSum, updatedDate]
            const newInputDay=new Date(updatedDate).getDate()
            const previousInputDay=new Date(item.values[2]).getDate()
            if(previousInputDay<newInputDay){
                window.dateCol.textContent=updatedDate
            }
            if(previousInputDay>newInputDay){
                updatedValues[2]=item.values[2]
                window.dateCol.textContent=item.values[2]
            }
            const formattedSum=formatCurrency(updateSum)
            // Select correct row to update the amount col
            let listNodes=window.amountCol.parentElement.parentElement.children
            // Create array to use filter method
            listNodes=Object.entries(listNodes)
            const nodeToUpdate=listNodes.filter(node => {
                if(node[1].dataset.id===window.dataID) return node
            })
            const amountChild=qs('#amount-col', nodeToUpdate[0][1])
            amountChild.textContent=formattedSum
            editLocalStorage(window.dataID, updatedValues, 'list')
            name.value=''
            amount.value=''
            date.value=''
        })
        return
    }
    setUpRow(window.dataID, values)
    addToLocalStorage(window.dataID, values, 'list')
})
// Creates rows of data on table
const setUpRow = (id, values) => {
    const formattedValue=formatCurrency(values[1])
    const row=createElement('tr', {dataset: {id: id}})
    row.innerHTML=`<td>${values[0]}</td>
                    <td id="amount-col">${formattedValue}</td>
                    <td id="date-col">${values[2]}</td>
                    <td class="delete-btn"><img
                            src="https://img.icons8.com/external-dreamstale-lineal-dreamstale/32/000000/external-delete-ui-dreamstale-lineal-dreamstale-2.png" />
                    </td>`
    name.value=''
    amount.value=''
    date.value=''
    table.appendChild(row)
    window.dateCol=qs('#date-col', row)
    window.amountCol=qs('#amount-col', row)
    const deleteBtn=qs('.delete-btn', row)
    deleteBtn.addEventListener('click', e => {
        //retrieve sum from local storage and update it
        let sumLS=getLocalStorage('expenses')
        sumLS.forEach(item => {
            let sum=item.values
            sum-=parseInt(values[1])
            const formattedSum=formatCurrency(sum)
            window.expensesDisplay.textContent=formattedSum
            editLocalStorage(3, sum, 'expenses')
        })
        const target=e.currentTarget.parentElement
        const targetID=target.dataset.id
        table.removeChild(target)
        if(table.childNodes.length<2){
            table.classList.add('hidden')
        }
        removeFromLocalStorage(targetID, 'list')
    })
}
// Creates nice animation for buttons
allBTN.forEach(btn => {
    btn.onmousemove = e => {
        const x=e.pageX-btn.offsetLeft
        const y=e.pageY-btn.offsetTop
        btn.style.setProperty('--x', x+'px')
        btn.style.setProperty('--y', y+'px')
    }
})
// Alert functionality function
let isRunning=false
const myAlert = (command, type) => {
    if(isRunning) return
    isRunning=true
    type.classList.remove('hide')
    type.classList.add('show')
    if(type===negativeAlert){
        alertMessage.textContent=command
        closeAlert.addEventListener('click', () => {
            type.classList.remove('show')
            type.classList.add('hide')
        })
    }
    if(type===positiveAlert){
        positiveAlertMessage.textContent=command
        closePositiveAlert.addEventListener('click', () => {
            type.classList.remove('show')
            type.classList.add('hide')
        })
    }
    // Closes alert after 3 seconds
    // If it is still open
    sleep(3000).then(() => {
        type.classList.remove('show')
        type.classList.add('hide')
    })
    // allows for another function call until 
    sleep(4000).then(() => {
        isRunning=false
    })
}
// Adds values to modal and to local storage at start of month
const uploadInfo = () => {
    if(!hasOneMonthPassed())return
    const expensesDisplayValue=getLocalStorage('expenses')
    const incomeDisplayValue=getLocalStorage('income')
    if(incomeDisplayValue.length<1 || expensesDisplayValue.length<1) return
    const id=new Date().getTime().toString()
    const number=new Date().getMonth()

    const thisMonth=getMonth(number)
    let saved=parseFloat(incomeDisplayValue[0].values)-parseFloat(expensesDisplayValue[0].values)
    const spent=expensesDisplayValue[0].values
    const history=[thisMonth, saved, spent]

    setUpModalRow(id, history)
    addToLocalStorage(id, history, 'history')
    let updatedSavings
    let savingsLS=getLocalStorage('savings')
    savingsLS.forEach(item => {
        let previousSavings
        if(item.values===''){
            previousSavings=0
        }
        else{
            previousSavings=parseInt(item.values)
        }
        let savingsSum=previousSavings
        if(saved>=0){
            savingsSum+=saved
        }
        if(saved<0){
            savingsSum-=saved
        }
        updatedSavings=savingsSum
        const formattedSavings=formatCurrency(savingsSum)
        // window.globalSavings=savingsSum
        window.savingsDisplay.textContent=formattedSavings
        editLocalStorage(1, savingsSum, 'savings')
    })
    // Removing all items related to the past month
    localStorage.removeItem('list')
    localStorage.removeItem('income')
    localStorage.removeItem('expenses')
    accountInfo.removeChild(window.div1)
    accountInfo.removeChild(window.div2)
    accountInfo.removeChild(window.div3)
    table.classList.add('hidden')
    inputContainer.classList.add('hidden')
    savingsContainer.classList.remove('hidden')

    accountSavings.value=updatedSavings
    accountSavings.readOnly=true
    myAlert('History updated succesfully!', positiveAlert)
}
// Checks if it is already the next month
const hasOneMonthPassed = () => {
    let updateDateLS=getLocalStorage('update')
    const currentMonth=new Date().getMonth()
    const nextMonth=updateDateLS[0].values
    if(currentMonth===nextMonth){
        editLocalStorage(updateDateLS[0].id, nextMonth+1, 'update')
        return true
    }
    if(currentMonth<nextMonth || currentMonth>nextMonth)return false
    return false
}
// Sets the next month as the update month in local storage
let temp=getLocalStorage('update')
const updateMonth=new Date().getMonth()+1
if(temp.length<1){
    addToLocalStorage(1, updateMonth, 'update')
}