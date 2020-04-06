import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActiveFilterService } from "../../services/navigation/activeFilter.service";
import { AvailableLabelsService } from "../../services/navigation/availableLabels.service";
import { SnippetLoaderService } from "../../services/navigation/snippetLoader.service";
import { Observable, Subscription } from "rxjs";
import { AvailableLanguagesService } from "../../services/navigation/availableLanguages.service";
import { AuthResource } from '../../services/resources/auth.resource';
import { Select, Store } from "@ngxs/store";
import { RefreshScope, UpdateScope } from "../../state/scope/scope.actions";
import { ScopeState } from "../../state/scope/scope.state";
import { ScopeModel } from "../../state/scope/scope.model";

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss'],
})
export class BaseComponent implements OnInit, OnDestroy {

  isLoggedIn: boolean = false;

  scopeSubscription: Subscription;

  @Select(ScopeState) scope$: Observable<ScopeModel>;

  constructor(private store: Store,
              private authResource: AuthResource,
              private activeFilterService: ActiveFilterService,
              private availableLabelsService: AvailableLabelsService,
              private availableLanguagesService: AvailableLanguagesService,
              private snippetLoaderService: SnippetLoaderService,) {
  }

  ngOnInit() {
    /**
     * Refresh snippets on scope changes
     */
    this.scope$.toPromise().then(() => {
      this.activeFilterService.updateFilter('main', 'all');
    });
    this.scopeSubscription = this.scope$.subscribe((scope: ScopeModel) => {
      if (scope && scope.area) {
        this.snippetLoaderService.activeSnippet = null;
        this.availableLabelsService.refreshLabels();
        this.availableLanguagesService.refreshLanguages();
      }
    });
    this.store.dispatch(new RefreshScope());

    /**
     * Subscribe for user status changes
     */
    this.authResource.loginStatusUpdates.subscribe((value) => {
      let scope: ScopeModel;

      this.isLoggedIn = value;

      // Update scope for loading data
      if (value) {
        scope = {
          area: 'user',
          value: this.authResource.currentUser,
        };
      } else {
        scope = {
          area: null,
          value: null,
        };
      }

      this.store.dispatch(new UpdateScope(scope));
    });
  }

  ngOnDestroy() {
    this.scopeSubscription.unsubscribe();
  }

}
