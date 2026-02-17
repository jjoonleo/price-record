import { CompareScreenContainer } from '../src/features/compare/CompareScreenContainer';
import { CompareScreenStoreProvider } from '../src/features/compare/store/compareScreenStoreContext';

export default function CompareRoute() {
  return (
    <CompareScreenStoreProvider>
      <CompareScreenContainer />
    </CompareScreenStoreProvider>
  );
}
