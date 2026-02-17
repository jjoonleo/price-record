import { HomeScreenContainer } from '../src/features/home/HomeScreenContainer';
import { HomeScreenStoreProvider } from '../src/features/home/store/homeScreenStoreContext';

export default function HomeRoute() {
  return (
    <HomeScreenStoreProvider>
      <HomeScreenContainer />
    </HomeScreenStoreProvider>
  );
}
