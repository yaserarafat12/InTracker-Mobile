export const getPrismStyle = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const imgIndex = (Math.abs(hash) % 5) + 1;
  const posX = Math.abs((hash * 13) % 80); 
  const posY = Math.abs((hash * 23) % 80);
  
  return {
    backgroundImage: `url('/all_images/bg_for_todo_display_testing_only/${imgIndex}.png')`,
    backgroundPosition: `${posX}% ${posY}%`,
    backgroundSize: '1672px 941px',
    backgroundRepeat: 'no-repeat'
  };
};

