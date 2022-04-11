import { addToLocalStorage, getLocalStorage, editLocalStorage, removeFromLocalStorage, log, qs, qsa, createElement, formatCurrency, sanitizeInput, getMonth }  from "./utils.js"
const schedule=require('node-schedule')
// Query selectors for table and input section
const name=qs('#name')
const amount=qs('#amount')
const date=qs('#date')
const addExpenseBtn=qs('#add-expense-btn')
const tableContainer=qs('.output-table')
const options=qs('.options')
// Query selectors for account information section
const accountSavings=qs('#account-savings')
const income=qs('#income')
const saveBTN=qs('#save-btn')
const inputContainer=qs('#input')
const savingsContainer=qs('#savings')
const showTableBTN=qs('#show-table')
const accountInfo=qs('.info')
const editBTN=qs('.edit')
//Query Selector Modal
const openModalButton=qsa('[data-modal-target]')
const closeModalButton=qsa('[data-close-btn]')
const overlay=qs('#overlay')
const body=qs('body')
const uploadBtn=qs('.upload')
const historyTable=qs('.display-table')

// Creates table but hides it as there is no data still
const table=createElement('table', {class: 'hidden'})
tableContainer.appendChild(table)
table.innerHTML=`<tr>
                    <th>Name</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th></th>
                </tr>`

// Retrieve all information inside LocalStorage API
window.addEventListener('DOMContentLoaded', () => {
    let items=getLocalStorage('list')
    let savings=getLocalStorage('savings')
    let income=getLocalStorage('income')
    let expenses=getLocalStorage('expenses')

    if(savings.length<1 && income.length<1)return
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

    if(items.length<1)return
    items.forEach(item => {
        setUpRow(item.id, item.values)
    })
})
// Mainly calls functions to set up the account info section and to add all values into local storage if they dont exist already
saveBTN.addEventListener('click', () => {
    let accountSavingsValue=accountSavings.value
    let incomeValue=income.value
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
    window.span=qs('.span', DIV)

    if(command==='savings'){
        all.classList.add('first')
        span.classList.add('blue')
        editLocalStorage(id, value, command)
    }
    if(command==='income'){
        all.classList.add('second')
        span.classList.add('green')
        editLocalStorage(id, value, command)
    }
    if(command==='expenses'){
        all.classList.add('third')
        span.classList.add('red')
        editLocalStorage(id, value, command)
    }

    editBTN.addEventListener('click', () => {
        inputContainer.classList.add('hidden')
        savingsContainer.classList.remove('hidden')
        accountInfo.removeChild(DIV)
        localStorage.clear()
        table.classList.add('hidden')
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
})
// Modal open/close functionality
openModalButton.forEach(button => {
    button.addEventListener('click', () => {
        const modal=qs(button.dataset.modalTarget)
        if(!modal) return
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
schedule.scheduleJob('*/2 * * * * *', () => {
    log('hi')
})
uploadBtn.addEventListener('click', () => {
    const id=new Date().getTime().toString()
    const number=new Date().getMonth()
    const thisMonth=getMonth(number)
    const expensesDisplayValue=getLocalStorage('expenses')
    const incomeDisplayValue=getLocalStorage('income')
    let saved=parseFloat(incomeDisplayValue[0].values)-parseFloat(expensesDisplayValue[0].values)
    const spent=expensesDisplayValue[0].values
    const history=[thisMonth, saved, spent]
    const row=createElement('row', {dataset: {id: id}})
    row.innerHTML=`<td>${thisMonth}</td>
                    <td>${saved}</td>
                    <td>${spent}</td>`
    historyTable.appendChild(row)
})
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
        alert('Missing Information!')
        return
    }
    if(currentDay<inputDay && currentMonth<inputMonth && currentYear<inputYear){
        alert("Date can't be past today!")
        return
    }
    if(currentMonth<inputMonth){
        alert("Only current month allowed!")
        return
    }
    if(amountValue==='0'){
        alert("Amount can't be 0!")
        return
    }
    //retrieve expenses from local storage and update it
    let sumLS=getLocalStorage('expenses')
    sumLS.forEach(item => {
        let sum=item.values
        sum+=parseInt(amountValue)
        const formattedSum=formatCurrency(sum)
        window.span.textContent=formattedSum
        editLocalStorage(3, sum, 'expenses')
    })
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
            window.amountCol.textContent=formattedSum
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
            window.span.textContent=formattedSum
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
// Displays table if there is at least 2 rows
showTableBTN.addEventListener('click', () => {
    if(table.childNodes.length<2){
        alert('No Expenses Found!')
        table.classList.add('hidden')
        return
    }
    table.classList.toggle('hidden')
})