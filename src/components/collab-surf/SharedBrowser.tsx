'use client';
import { CardContent } from '@/components/ui/card';
import Toolbar from './Toolbar';
import SummarizeTooltip from './SummarizeTooltip';
import BackendSetup from './BackendSetup';

const LOREM_IPSUM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam. Proin sed quam. Etiam vel ipsum. Aliquam erat volutpat. Integer ut magna. Praesent id turpis. Integer mi. Cras vel urna. Proin vitae odio. Vivamus euismod, neque et pulvinar interdum, dolor magna laoreet eros, vel pulvinar tellus justo sit amet est. Nulla facilisi. Sed sit amet quam. Sed quis ante. Duis eget est. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi.";

export default function SharedBrowser() {
  return (
    <div className="flex flex-col h-full bg-card rounded-lg shadow-lg border">
      <Toolbar />
      <CardContent className="flex-1 p-0 relative flex flex-col">
        <SummarizeTooltip>
          <div id="browser-content" className="flex-1 h-full w-full overflow-y-auto p-6 md:p-8 text-base md:text-lg leading-relaxed">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 font-headline">Collaborative Browser View</h1>
            <p className="text-muted-foreground mb-6">This is a placeholder for the shared browser. The actual implementation would stream the browser view from a server. For now, you can select text below to try the summarization feature.</p>
            <div className="prose dark:prose-invert max-w-none">
              <p>{LOREM_IPSUM}</p>
              <p>{LOREM_IPSUM}</p>
            </div>
          </div>
        </SummarizeTooltip>
        <div className="p-4 border-t mt-auto">
          <BackendSetup />
        </div>
      </CardContent>
    </div>
  );
}
