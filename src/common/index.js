import React from 'react';

const App = () => {
  const arr1 = ['这', '里', '是', '瓜', '瓜', '龙'];

  const arr2 = [{id: 'aaaaa'}, {id: 'bbbbb'}, {id: 'ccccc'}];

  const arr3 = [{info: {id: '这里是'}}, {info: {id: '瓜瓜龙'}}];

  return (
    <div className="root">
      {/* {arr1.map((item, index) => (
        <span key={index} className="text-arr1">{item}</span>
      ))} */}

      <span r-for={(item, index) in arr1} key={index} className="text-arr1">
        {item}
      </span>

      <div className="wrapper">
        <strong r-for={(item, index) in arr2} key={index} className="text-arr2">
          {item.id}
        </strong>
      </div>

      <p r-for={(item, index) in arr3} key={index} className="text-arr3">
        {item.info.id}
      </p>
    </div>
  )
}

export default App


// import React from 'react';

// const App = () => {
//   const arr1 = ['这', '里', '是', '瓜', '瓜', '龙'];
//   return (
//     <div className="root">
//       <span r-for={(item, index) in arr1} key={index} className="text-arr1">
//         {item}
//       </span>
//     </div>
//   )
// }

// export default App
